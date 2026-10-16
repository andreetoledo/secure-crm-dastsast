import test from 'node:test';
import assert from 'node:assert';
import { createRequire } from 'node:module';
import path from 'node:path';
import { api, loginAs, JWT_SECRET } from '../test-support/api.mjs';

const jwt = createRequire(path.resolve('apps/api/package.json'))('jsonwebtoken');

function unsignedToken(payload) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'none', typ: 'JWT' })}.${b64(payload)}.`;
}

test('CWE-347 / #15: tokens JWT falsificados son rechazados', async (t) => {
  const adminClaims = { sub: 1, username: 'admin', role: 'admin' };

  await t.test('Token con alg "none" (sin firma) haciendose pasar por admin -> 401', async () => {
    const res = await api().get('/api/users').set('Authorization', `Bearer ${unsignedToken(adminClaims)}`);
    assert.strictEqual(res.status, 401);
  });

  await t.test('Token firmado con un secreto adivinado ("secret123") -> 401', async () => {
    const forged = jwt.sign(adminClaims, 'secret123');
    const res = await api().get('/api/users').set('Authorization', `Bearer ${forged}`);
    assert.strictEqual(res.status, 401);
  });

  await t.test('Viewer edita su payload a role=admin manteniendo la firma original -> 401', async () => {
    const [header, , signature] = (await loginAs('viewer')).split('.');
    const tampered = Buffer.from(JSON.stringify({ sub: 3, username: 'viewer', role: 'admin' })).toString('base64url');
    const res = await api().get('/api/users').set('Authorization', `Bearer ${header}.${tampered}.${signature}`);
    assert.strictEqual(res.status, 401);
  });

  await t.test('Algoritmo distinto de HS256 (HS512 con el secreto correcto) -> 401', async () => {
    const otherAlg = jwt.sign(adminClaims, JWT_SECRET, { algorithm: 'HS512' });
    const res = await api().get('/api/users').set('Authorization', `Bearer ${otherAlg}`);
    assert.strictEqual(res.status, 401);
  });
});

test('CWE-862: un viewer no puede ejecutar acciones de admin/agent', async (t) => {
  const viewer = await loginAs('viewer');
  const auth = { Authorization: `Bearer ${viewer}` };

  await t.test('Listar usuarios -> 403', async () => {
    assert.strictEqual((await api().get('/api/users').set(auth)).status, 403);
  });

  await t.test('Escalar privilegios creando una cuenta admin -> 403', async () => {
    const res = await api().post('/api/users').set(auth).send({ username: 'hacker', password: 'x', role: 'admin' });
    assert.strictEqual(res.status, 403);
  });

  await t.test('Cambiar su propio rol a admin -> 403', async () => {
    assert.strictEqual((await api().put('/api/users/3/role').set(auth).send({ role: 'admin' })).status, 403);
  });

  await t.test('Editar y borrar tickets -> 403', async () => {
    assert.strictEqual((await api().put('/api/tickets/1').set(auth).send({ title: 'x' })).status, 403);
    assert.strictEqual((await api().delete('/api/tickets/1').set(auth)).status, 403);
  });
});

test('CWE-256: ni siquiera un admin recibe hashes de contraseñas', async () => {
  const admin = await loginAs('admin');
  const list = await api().get('/api/users').set('Authorization', `Bearer ${admin}`);
  const one = await api().get('/api/users/1').set('Authorization', `Bearer ${admin}`);
  assert.strictEqual(list.status, 200);
  assert.doesNotMatch(JSON.stringify(list.body), /password|[0-9a-f]{32}:[0-9a-f]{64,}/i);
  assert.doesNotMatch(JSON.stringify(one.body), /password|[0-9a-f]{32}:[0-9a-f]{64,}/i);
});

test('CWE-1004: la cookie de sesion no es legible desde JavaScript', async () => {
  const res = await api().post('/api/auth/login').send({ username: 'admin', password: 'Admin123!' });
  const cookie = res.headers['set-cookie'].find((c) => c.startsWith('session='));
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);
});

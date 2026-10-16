import test from 'node:test';
import assert from 'node:assert';
import { api, loginAs, hashPassword } from '../test-support/api.mjs';

// CWE-89: se envian payloads de inyeccion SQL reales a los endpoints.

test('CWE-89: bypass de login con inyeccion SQL', async (t) => {
  const payloads = [
    { username: "admin' --", password: 'cualquiera' },
    { username: "' OR '1'='1' --", password: 'cualquiera' },
    { username: 'admin', password: "' OR '1'='1" },
  ];
  for (const body of payloads) {
    await t.test(`username=${body.username} password=${body.password} -> 401 sin token`, async () => {
      const res = await api().post('/api/auth/login').send(body);
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.token, undefined);
    });
  }

  await t.test('UNION SELECT que inyecta una fila admin con un hash conocido por el atacante -> 401', async () => {
    const attackerHash = hashPassword('hackeado');
    const username = `nadie' UNION SELECT 99,'admin','x@x','X','admin','${attackerHash}','2026' --`;
    const res = await api().post('/api/auth/login').send({ username, password: 'hackeado' });
    assert.strictEqual(res.status, 401, 'El atacante inicio sesion como admin con su propia contraseña');
  });

  await t.test("Una comilla suelta no rompe la consulta (401, no 500)", async () => {
    const res = await api().post('/api/auth/login').send({ username: "admin'", password: 'x' });
    assert.strictEqual(res.status, 401);
  });
});

test('CWE-89: inyeccion en la busqueda de tickets', async (t) => {
  const auth = { Authorization: `Bearer ${await loginAs('agent')}` };

  await t.test("q=' OR '1'='1 no devuelve todos los tickets", async () => {
    const res = await api().get('/api/tickets').query({ q: "zzz' OR '1'='1" }).set(auth);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.tickets.length, 0);
  });

  await t.test('UNION SELECT no filtra la tabla de usuarios', async () => {
    const q = "%' UNION SELECT id,username,password_hash,role,email,email,id,id,id,email,email FROM users --";
    const res = await api().get('/api/tickets').query({ q }).set(auth);
    assert.strictEqual(res.status, 200);
    assert.doesNotMatch(JSON.stringify(res.body.tickets), /[0-9a-f]{32}:[0-9a-f]{64,}/);
  });

  await t.test('La tabla users sigue existiendo despues de un payload destructivo', async () => {
    await api().get('/api/tickets').query({ q: "'; DROP TABLE users; --" }).set(auth);
    const res = await api().post('/api/auth/login').send({ username: 'admin', password: 'Admin123!' });
    assert.strictEqual(res.status, 200);
  });
});

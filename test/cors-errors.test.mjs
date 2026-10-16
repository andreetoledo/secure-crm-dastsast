import test from 'node:test';
import assert from 'node:assert';
import { api, loginAs } from '../test-support/api.mjs';

test('CWE-942: un sitio malicioso no puede leer datos de la API con las cookies de la victima', async (t) => {
  const auth = { Authorization: `Bearer ${await loginAs('agent')}` };

  await t.test('Origin: https://evil.example no recibe Access-Control-Allow-Origin', async () => {
    const res = await api().get('/api/tickets').set(auth).set('Origin', 'https://evil.example');
    assert.strictEqual(res.headers['access-control-allow-origin'], undefined);
    assert.strictEqual(res.headers['access-control-allow-credentials'], undefined);
  });

  await t.test('El preflight desde un origen malicioso tampoco se autoriza', async () => {
    const res = await api()
      .options('/api/users')
      .set('Origin', 'https://evil.example')
      .set('Access-Control-Request-Method', 'DELETE');
    assert.strictEqual(res.headers['access-control-allow-origin'], undefined);
  });

  await t.test('El frontend legitimo (http://localhost:3000) si es autorizado', async () => {
    const res = await api().get('/api/tickets').set(auth).set('Origin', 'http://localhost:3000');
    assert.strictEqual(res.headers['access-control-allow-origin'], 'http://localhost:3000');
  });
});

test('CWE-209: un error provocado no revela stack trace ni rutas internas', async () => {
  const res = await api().post('/api/auth/login').set('Content-Type', 'application/json').send('{"username":');
  assert.ok(res.status >= 400);
  const body = JSON.stringify(res.body);
  assert.doesNotMatch(body, /stack|SyntaxError|at \w+ \(|node_modules|[A-Z]:\\|\/app\//);
});

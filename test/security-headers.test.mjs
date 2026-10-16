import test from 'node:test';
import assert from 'node:assert';
import { api } from '../test-support/api.mjs';
import { buildCsp, SECURITY_HEADERS } from '../apps/web/csp.mjs';
import nextConfig from '../apps/web/next.config.mjs';

// Hallazgos #3, #7, #8, #9, #10 y #12. Se hacen peticiones HTTP reales a la API y se
// evalua la CSP que el frontend envia en produccion.

test('API: las respuestas HTTP reales llevan las cabeceras de seguridad (#3, #7-#10, #12)', async (t) => {
  const res = await api().get('/api/health');

  await t.test('Fingerprinting (#3): la respuesta no revela X-Powered-By: Express', () => {
    assert.strictEqual(res.headers['x-powered-by'], undefined);
  });

  await t.test('Clickjacking (#8): un sitio externo no puede embeber la API en un iframe', () => {
    assert.strictEqual(res.headers['x-frame-options'], 'DENY');
    assert.match(res.headers['content-security-policy'], /frame-ancestors 'none'/);
  });

  await t.test('MIME sniffing (#9): nosniff presente', () => {
    assert.strictEqual(res.headers['x-content-type-options'], 'nosniff');
  });

  await t.test('Aislamiento (#10) y Permissions-Policy (#12)', () => {
    assert.strictEqual(res.headers['cross-origin-opener-policy'], 'same-origin');
    assert.strictEqual(res.headers['cross-origin-resource-policy'], 'same-origin');
    assert.match(res.headers['permissions-policy'], /camera=\(\)/);
  });

  await t.test('CSP (#7): la API no permite cargar ningun recurso', () => {
    assert.match(res.headers['content-security-policy'], /default-src 'none'/);
  });
});

test('Web: la CSP de produccion bloquea scripts inyectados (#7 y alertas medias de ZAP Fase 2)', async (t) => {
  const nonce = 'bm9uY2UtZGUtcHJ1ZWJh';
  const csp = buildCsp(nonce, false);
  const directive = (name) => csp.split('; ').find((d) => d.startsWith(`${name} `)) ?? '';

  await t.test('Un <script> o un onerror= inyectado sin nonce no se ejecuta: no hay unsafe-inline', () => {
    assert.doesNotMatch(directive('script-src'), /'unsafe-inline'/);
    assert.match(directive('script-src'), new RegExp(`'nonce-${nonce}'`));
  });

  await t.test('eval() de una cadena inyectada queda bloqueado: no hay unsafe-eval', () => {
    assert.doesNotMatch(csp, /'unsafe-eval'/);
  });

  await t.test('Un <style> inyectado sin nonce no se aplica', () => {
    assert.doesNotMatch(directive('style-src'), /'unsafe-inline'/);
  });

  await t.test('Un formulario inyectado no puede enviar datos a otro dominio (form-action)', () => {
    assert.strictEqual(directive('form-action'), "form-action 'self'");
  });

  await t.test('img-src no acepta cualquier dominio https: (comodin)', () => {
    assert.doesNotMatch(directive('img-src'), /https:/);
  });

  await t.test('Cada peticion recibe un nonce distinto', () => {
    assert.notStrictEqual(buildCsp('a', false), buildCsp('b', false));
  });
});

test('Web: next.config aplica las cabeceras estaticas a todas las rutas (#3, #8-#10, #12)', async () => {
  assert.strictEqual(nextConfig.poweredByHeader, false, 'Next no debe enviar X-Powered-By');
  const [rule] = await nextConfig.headers();
  assert.strictEqual(rule.source, '/(.*)');
  const sent = Object.fromEntries(rule.headers.map((h) => [h.key, h.value]));
  for (const { key, value } of SECURITY_HEADERS) {
    assert.strictEqual(sent[key], value, `Falta ${key}`);
  }
});

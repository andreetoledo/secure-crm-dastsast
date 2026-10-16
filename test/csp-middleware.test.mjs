import test from 'node:test';
import assert from 'node:assert';
import { createRequire } from 'node:module';
import path from 'node:path';

// #7 y alertas medias de ZAP Fase 2: el middleware real de Next fija una CSP con un nonce
// distinto por peticion, de modo que un script inyectado (sin nonce) no se ejecuta.
const { NextRequest } = createRequire(path.resolve('apps/web/package.json'))('next/server');
const { middleware } = await import('../apps/web/middleware.ts');

const nonceOf = (csp) => csp.match(/'nonce-([^']+)'/)?.[1];

test('CSP con nonce por peticion en el middleware de Next (#7)', async (t) => {
  const first = middleware(new NextRequest('http://localhost:3000/login'));
  const second = middleware(new NextRequest('http://localhost:3000/login'));
  const csp = first.headers.get('content-security-policy');

  await t.test('La respuesta lleva Content-Security-Policy sin unsafe-inline ni unsafe-eval', () => {
    assert.ok(csp, 'La respuesta no trae CSP');
    assert.doesNotMatch(csp, /'unsafe-inline'|'unsafe-eval'/);
    assert.match(csp, /frame-ancestors 'none'/);
  });

  await t.test('Un atacante no puede reutilizar el nonce: cambia en cada peticion', () => {
    const nonce = nonceOf(csp);
    assert.ok(nonce, 'La CSP no incluye un nonce');
    assert.notStrictEqual(nonce, nonceOf(second.headers.get('content-security-policy')));
  });

  await t.test('Next recibe el mismo nonce para firmar sus propios <script>', () => {
    assert.strictEqual(first.headers.get('x-middleware-request-x-nonce'), nonceOf(csp));
  });
});

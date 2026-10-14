import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

test('Cabeceras de Seguridad y Proteccion contra Clickjacking/XSS (DAST ZAP & SAST S5689)', async (t) => {
  const indexPath = path.resolve('apps/api/src/index.ts');
  const nextConfigPath = path.resolve('apps/web/next.config.mjs');

  const indexContent = fs.readFileSync(indexPath, 'utf-8');
  const nextContent = fs.readFileSync(nextConfigPath, 'utf-8');

  await t.test('Mitiga S5689 y Fingerprinting: Express deshabilita x-powered-by', () => {
    assert.ok(
      indexContent.includes("app.disable('x-powered-by')") ||
      indexContent.includes('app.disable("x-powered-by")'),
      'Express debe deshabilitar explicitamente x-powered-by para mitigar identificacion del framework'
    );
  });

  await t.test('Mitiga Next.js Fingerprinting: poweredByHeader desactivado en next.config.mjs', () => {
    assert.ok(
      nextContent.includes('poweredByHeader: false'),
      'Next.js debe configurar poweredByHeader: false'
    );
  });

  await t.test('Mitiga Alertas DAST: X-Frame-Options y Content-Security-Policy configurados en Next.js', () => {
    assert.ok(
      nextContent.includes('Content-Security-Policy'),
      'Falta cabecera Content-Security-Policy (ZAP Medium / CWE-693)'
    );
    assert.ok(
      nextContent.includes('X-Frame-Options') && nextContent.includes('DENY'),
      'Falta cabecera X-Frame-Options: DENY para mitigar Clickjacking (ZAP Medium / CWE-1021)'
    );
    assert.ok(
      nextContent.includes('X-Content-Type-Options') && nextContent.includes('nosniff'),
      'Falta cabecera X-Content-Type-Options: nosniff (ZAP Low / CWE-16)'
    );
  });

  await t.test('Mitiga Alertas DAST en la API: Cabeceras de seguridad presentes en index.ts', () => {
    assert.ok(
      indexContent.includes('X-Frame-Options'),
      'La API debe emitir cabecera X-Frame-Options'
    );
    assert.ok(
      indexContent.includes('X-Content-Type-Options'),
      'La API debe emitir cabecera X-Content-Type-Options'
    );
  });
});

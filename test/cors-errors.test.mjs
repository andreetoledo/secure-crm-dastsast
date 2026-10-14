import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

test('Proteccion contra CORS Permisivo y Fuga de Informacion en Errores (CWE-942 / CWE-209)', async (t) => {
  const indexPath = path.resolve('apps/api/src/index.ts');
  const indexContent = fs.readFileSync(indexPath, 'utf-8');

  await t.test('Mitiga CWE-942: No permite CORS universal indiscriminado con credenciales', () => {
    const hasUniversalCorsReflection = indexContent.includes('origin: (_origin, cb) => cb(null, true)');
    assert.strictEqual(
      hasUniversalCorsReflection,
      false,
      'CWE-942: La aplicacion refleja cualquier origen arbitrario con credenciales habilitadas'
    );
    assert.ok(
      indexContent.includes('allowedOrigins') || indexContent.includes('localhost:3000'),
      'La politica CORS debe validar origenes explicitos autorizados (whitelist)'
    );
  });

  await t.test('Mitiga CWE-209: El manejador de errores 500 no expone stack traces al cliente', () => {
    const leaksStack = indexContent.includes('stack: err?.stack') || indexContent.includes('stack: err.stack');
    assert.strictEqual(
      leaksStack,
      false,
      'CWE-209: El manejador de errores HTTP 500 expone el stack trace de ejecucion sensible'
    );
  });
});

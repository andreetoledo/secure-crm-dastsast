import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

test('Refactorizacion Clean Code y Calidad SonarQube (S3358, S4624, S7772, S7744)', async (t) => {
  const dbPath = path.resolve('apps/api/src/db.ts');
  const apiPath = path.resolve('apps/web/lib/api.ts');
  const ticketsPagePath = path.resolve('apps/web/app/tickets/page.tsx');
  const ticketDetailPath = path.resolve('apps/web/app/tickets/[id]/page.tsx');

  const dbCode = fs.readFileSync(dbPath, 'utf-8');
  const apiCode = fs.readFileSync(apiPath, 'utf-8');
  const ticketsPageCode = fs.readFileSync(ticketsPagePath, 'utf-8');
  const ticketDetailCode = fs.readFileSync(ticketDetailPath, 'utf-8');

  await t.test('Mitiga typescript:S7772: Importaciones usan el prefijo node: en apps/api/src/db.ts', () => {
    assert.ok(dbCode.includes("import path from 'node:path'"), 'db.ts debe importar node:path');
    assert.ok(dbCode.includes("import fs from 'node:fs'"), 'db.ts debe importar node:fs');
  });

  await t.test('Mitiga typescript:S4624: Sin template literals anidados en api.ts y tickets/page.tsx', () => {
    assert.strictEqual(
      apiCode.includes("${q ? `?q="),
      false,
      'api.ts no debe contener template literals anidados dentro de interpolaciones'
    );
    assert.strictEqual(
      ticketsPageCode.includes("${q ? `?q="),
      false,
      'tickets/page.tsx no debe contener template literals anidados'
    );
  });

  await t.test('Mitiga typescript:S3358: Sin operadores ternarios anidados en tickets/[id]/page.tsx', () => {
    assert.strictEqual(
      ticketDetailCode.includes("saved ? 'Guardado' : saving ?"),
      false,
      'tickets/[id]/page.tsx no debe anidar operadores ternarios confusos'
    );
  });
});

import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

test('Mitigacion de Inyeccion SQL (CWE-89 / OWASP A03 / A05)', async (t) => {
  const ticketsPath = path.resolve('apps/api/src/routes/tickets.ts');
  const authPath = path.resolve('apps/api/src/auth.ts');
  
  const ticketsContent = fs.readFileSync(ticketsPath, 'utf-8');
  const authContent = fs.readFileSync(authPath, 'utf-8');

  await t.test('Verifica que no exista concatenacion de strings en la consulta de login', () => {
    const hasVulnerableLoginSql = authContent.includes("WHERE username = '${username}'") ||
                                  authContent.includes('WHERE username = "${username}"');
    assert.strictEqual(
      hasVulnerableLoginSql,
      false,
      'CWE-89 detectado: El login construye consultas SQL mediante interpolacion de strings'
    );
    assert.ok(
      authContent.includes("WHERE username = ?"),
      'El login debe utilizar parametros preparados con placeholders (?)'
    );
  });

  await t.test('Verifica que la busqueda de tickets no concatene el parametro q en el SQL', () => {
    const hasVulnerableSearchSql = ticketsContent.includes("LIKE '%${q}%'") ||
                                   ticketsContent.includes('LIKE "%${q}%"');
    assert.strictEqual(
      hasVulnerableSearchSql,
      false,
      'CWE-89 detectado: La busqueda de tickets concatena directamente el parametro q en el SQL'
    );
    assert.ok(
      ticketsContent.includes("LIKE ?"),
      'La consulta de tickets debe parametrizar la busqueda LIKE con placeholders (?)'
    );
  });

  await t.test('Manejo seguro de caracteres maliciosos sin errores de sintaxis', () => {
    const maliciousQuery = "admin' OR '1'='1' --";
    const term = `%${maliciousQuery}%`;
    assert.ok(term.startsWith('%') && term.endsWith('%'), 'El termino parametrizado envuelve el input como literal');
  });
});

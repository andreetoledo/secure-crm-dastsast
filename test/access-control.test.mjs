import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

test('Control de Acceso, Verificacion JWT y Proteccion de Cookies (CWE-347, CWE-862, CWE-1004, CWE-256)', async (t) => {
  const authMiddlewarePath = path.resolve('apps/api/src/middleware/auth.ts');
  const authPath = path.resolve('apps/api/src/auth.ts');
  const usersPath = path.resolve('apps/api/src/routes/users.ts');
  const ticketsPath = path.resolve('apps/api/src/routes/tickets.ts');

  const authMiddlewareContent = fs.readFileSync(authMiddlewarePath, 'utf-8');
  const authContent = fs.readFileSync(authPath, 'utf-8');
  const usersContent = fs.readFileSync(usersPath, 'utf-8');
  const ticketsContent = fs.readFileSync(ticketsPath, 'utf-8');

  await t.test('Mitiga CWE-347: authenticate valida criptograficamente la firma con jwt.verify', () => {
    assert.strictEqual(
      authMiddlewareContent.includes('jwt.decode('),
      false,
      'CWE-347: Se esta usando jwt.decode sin validar la firma criptografica'
    );
    assert.ok(
      authMiddlewareContent.includes('jwt.verify('),
      'El middleware debe validar la firma del token mediante jwt.verify'
    );
  });

  await t.test('Mitiga CWE-1004: La cookie de sesion incluye la directiva httpOnly: true', () => {
    assert.ok(
      authContent.includes('httpOnly: true'),
      'CWE-1004: La cookie de sesion debe tener httpOnly: true para prevenir robo mediante XSS'
    );
  });

  await t.test('Mitiga CWE-862: Rutas de usuarios y tickets validan roles requeridos (RBAC)', () => {
    assert.ok(
      usersContent.includes('requireRole') || usersContent.includes("role !== 'admin'"),
      'La gestion de usuarios debe estar restringida al rol admin'
    );
    assert.ok(
      ticketsContent.includes('requireRole') || ticketsContent.includes("role === 'viewer'"),
      'Las operaciones de modificacion/eliminacion de tickets deben restringir al rol viewer'
    );
  });

  await t.test('Mitiga CWE-256: No filtra el hash de contraseñas en respuestas de usuarios', () => {
    assert.strictEqual(
      usersContent.includes('passwordHash: row.password_hash') ||
      usersContent.includes('password_hash: row.password_hash'),
      false,
      'CWE-256: La respuesta de usuarios no debe exponer hashes de contraseñas'
    );
  });
});

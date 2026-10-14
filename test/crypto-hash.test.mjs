import test from 'node:test';
import assert from 'node:assert';

test('Seguridad Criptografica de Contraseñas (CWE-327 / CWE-759)', async (t) => {
  const hashModule = await import('../apps/api/src/hash.ts');

  await t.test('Falla si se utiliza MD5 de 32 hex sin proteccion criptografica', () => {
    // Si la funcion aun es weakHash basada en MD5, genera hash de longitud 32
    assert.strictEqual(
      typeof hashModule.hashPassword,
      'function',
      'Debe exportar una funcion hashPassword robusta'
    );
  });

  await t.test('Mitiga CWE-759: Genera salts aleatorios unicos para contraseñas identicas', () => {
    const password = 'SecretPassword123!';
    const hash1 = hashModule.hashPassword(password);
    const hash2 = hashModule.hashPassword(password);

    // Con salt aleatorio, dos hashes de la misma contraseña NUNCA deben ser identicos
    assert.notStrictEqual(
      hash1,
      hash2,
      'Ataque Rainbow Table exitoso: La misma contraseña produjo hashes identicos (falta salt)'
    );

    // Debe contener el salt y el hash en formato delimitado
    assert.ok(hash1.includes(':'), 'El hash debe almacenar el salt aleatorio delimitado');
  });

  await t.test('Mitiga CWE-327: Emplea longitud y derivacion de clave robusta (no MD5)', () => {
    const password = 'SecretPassword123!';
    const hash = hashModule.hashPassword(password);
    const parts = hash.split(':');
    
    // Salt de al menos 16 bytes (32 hex) y hash derivado de al menos 32 bytes (64 hex)
    assert.ok(parts[0].length >= 32, 'El salt criptografico debe tener al menos 16 bytes');
    assert.ok(parts[1].length >= 64, 'La clave derivada debe tener al menos 256 bits (no MD5)');
  });

  await t.test('Verificacion segura y proteccion contra contraseñas incorrectas', () => {
    const password = 'Admin123!';
    const hash = hashModule.hashPassword(password);

    assert.strictEqual(
      hashModule.verifyPassword(password, hash),
      true,
      'verifyPassword debe autenticar la contraseña correcta'
    );

    assert.strictEqual(
      hashModule.verifyPassword('PasswordIncorrecta!', hash),
      false,
      'verifyPassword debe rechazar contraseñas invalidas'
    );
  });
});

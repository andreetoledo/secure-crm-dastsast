import crypto from 'crypto';

// Algoritmo seguro de derivacion de claves: PBKDF2 con SHA-512 y 100,000 iteraciones (OWASP / NIST).
// Mitiga CWE-327 (Algoritmo Criptografico Debil) y CWE-759 (Falta de Salt).
const ITERATIONS = 100000;
const KEY_LENGTH = 64; // 512 bits
const DIGEST = 'sha512';
const SALT_BYTES = 16;

/**
 * Genera un hash criptografico robusto con salt aleatorio unico por contrasena.
 * Formato resultante: <salt_hex>:<hash_hex>
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_BYTES).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return salt + ':' + hash;
}

/**
 * Verifica una contrasena contra un hash almacenado utilizando comparacion en tiempo constante
 * (timingSafeEqual) para mitigar ataques de temporizacion (CWE-208).
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash?.includes(':')) {
    return false;
  }

  const [salt, expectedHash] = storedHash.split(':');
  if (!salt || !expectedHash) {
    return false;
  }

  const actualHash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  const actualBuffer = Buffer.from(actualHash, 'utf-8');
  const expectedBuffer = Buffer.from(expectedHash, 'utf-8');

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

/**
 * Alias de compatibilidad para evitar roturas en llamadas existentes.
 */
export function weakHash(password: string): string {
  return hashPassword(password);
}

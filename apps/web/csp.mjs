// Politica de seguridad del frontend, definida en un unico lugar (#3, #7-#10, #12).
// La CSP usa un nonce por peticion en vez de 'unsafe-inline'. 'unsafe-eval' (y 'unsafe-inline' en estilos)
// solo se permiten en desarrollo porque el hot reload los necesita; nunca en produccion.

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const SECURITY_HEADERS = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

export function buildCsp(nonce, isDev = process.env.NODE_ENV === 'development') {
  const directives = {
    'default-src': ["'self'"],
    'script-src': ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(isDev ? ["'unsafe-eval'"] : [])],
    // En desarrollo Next inyecta <style> sin nonce para el hot reload.
    'style-src': isDev ? ["'self'", "'unsafe-inline'"] : ["'self'", `'nonce-${nonce}'`],
    'img-src': ["'self'", 'data:', 'blob:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'", API_URL],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  };
  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(' ')}`)
    .join('; ');
}

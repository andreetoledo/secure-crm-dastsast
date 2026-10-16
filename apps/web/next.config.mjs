import { SECURITY_HEADERS } from './csp.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@secure-crm/shared'],
  // Cabeceras estaticas para todas las rutas, incluidos /_next/static. La CSP con nonce
  // la fija middleware.ts porque cambia en cada peticion.
  async headers() {
    return [{ source: '/(.*)', headers: SECURITY_HEADERS }];
  },
};
export default nextConfig;

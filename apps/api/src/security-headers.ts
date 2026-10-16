import type { HelmetOptions } from 'helmet';

// Politica unica de cabeceras de seguridad de la API (mitiga CWE-693, CWE-1021, CWE-16).
// La API solo sirve JSON, por eso la CSP es la mas restrictiva posible.
export const API_HELMET_OPTIONS: Readonly<HelmetOptions> = {
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  // CORP solo aplica a peticiones no-cors; el fetch del frontend usa CORS y no se ve afectado.
  crossOriginResourcePolicy: { policy: 'same-origin' },
  // COEP aceptado como riesgo residual (hallazgo #11).
  crossOriginEmbedderPolicy: false,
};

// helmet no gestiona Permissions-Policy; se fija aparte.
export const PERMISSIONS_POLICY = 'camera=(), microphone=(), geolocation=()';

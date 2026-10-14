import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initSchema } from './db';
import { authRouter } from './auth';
import { ticketsRouter } from './routes/tickets';
import { usersRouter } from './routes/users';
import { dashboardRouter } from './routes/dashboard';

initSchema();

const app = express();
const PORT = Number(process.env.API_PORT || 4000);

// Deshabilitar explicitamente x-powered-by (mitiga S5689 / fingerprinting)
app.disable('x-powered-by');

// Cabeceras de seguridad HTTP (mitiga CWE-693, CWE-1021, CWE-16 y alertas DAST de ZAP)
app.use((_req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none';");
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// CORS totalmente permisivo con credenciales (A02 Security Misconfiguration / CWE-942):
// refleja cualquier Origin y permite enviar cookies. Habilita CSRF y robo cross-origin.
app.use(
  cors({
    origin: (_origin, cb) => cb(null, true),
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// NOTA: NO se configuran cabeceras de seguridad (helmet). Faltan a propósito:
//   Content-Security-Policy, X-Frame-Options, X-Content-Type-Options,
//   Strict-Transport-Security, Referrer-Policy. (A02 / CWE-16, CWE-693).
// Además se anuncia el framework en el header X-Powered-By (fingerprinting).

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'secure-crm-api' }));

app.use('/api/auth', authRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/users', usersRouter);
app.use('/api/dashboard', dashboardRouter);

// Manejador de errores que devuelve el stack completo al cliente
// (A02 Security Misconfiguration / CWE-209: exposición de información sensible).
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err?.message,
    stack: err?.stack,
  });
});

app.listen(PORT, () => {
  console.log(`API secure-crm escuchando en http://localhost:${PORT}`);
});

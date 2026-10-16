import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { authRouter } from './auth';
import { ticketsRouter } from './routes/tickets';
import { usersRouter } from './routes/users';
import { dashboardRouter } from './routes/dashboard';
import { API_HELMET_OPTIONS, PERMISSIONS_POLICY } from './security-headers';

// Politica CORS restringida con lista blanca autorizada (mitiga CWE-942)
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

export function createApp() {
  const app = express();

  // Confianza controlada en proxy inverso: solo el primer salto (mitiga spoofing en proxy-addr / #13)
  app.set('trust proxy', 1);

  // Deshabilitar explicitamente x-powered-by (mitiga S5689 / fingerprinting)
  app.disable('x-powered-by');

  // Cabeceras de seguridad HTTP, definidas una sola vez en security-headers.ts (#3, #7-#10, #12)
  app.use(helmet(API_HELMET_OPTIONS));
  app.use((_req, res, next) => {
    res.setHeader('Permissions-Policy', PERMISSIONS_POLICY);
    next();
  });

  app.use(
    cors({
      // Un origen no autorizado no recibe cabeceras CORS: el navegador bloquea la lectura.
      origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)),
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'secure-crm-api' }));

  app.use('/api/auth', authRouter);
  app.use('/api/tickets', ticketsRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/dashboard', dashboardRouter);

  // Manejador centralizado de errores seguro (mitiga CWE-209: no expone stack traces)
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Error interno capturado:', err?.message || err);
    const status = Number.isInteger(err?.status) && err.status < 500 ? err.status : 500;
    res.status(status).json({
      error: status === 500 ? 'Error interno del servidor' : 'Solicitud inválida',
      message: process.env.NODE_ENV === 'development' ? err?.message : 'Ha ocurrido un error inesperado',
    });
  });

  return app;
}

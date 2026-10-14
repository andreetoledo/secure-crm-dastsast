import { Router } from 'express';
import { db } from '../db';
import { hashPassword } from '../hash';
import { authenticate, requireRole, AuthedRequest } from '../middleware/auth';

export const usersRouter = Router();
usersRouter.use(authenticate);
usersRouter.use(requireRole('admin'));

// GET /api/users
// Broken Access Control: NO se valida que el usuario sea admin (A01 / CWE-862).
// Además filtra el password_hash de cada usuario (A04 / CWE-256: exposición de
// información sensible). Un 'viewer' puede listar todos los hashes.
usersRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM users ORDER BY id').all() as any[];
  res.json(
    rows.map((r) => ({
      id: r.id,
      username: r.username,
      email: r.email,
      fullName: r.full_name,
      role: r.role,
      passwordHash: r.password_hash, // fuga intencional
      createdAt: r.created_at,
    }))
  );
});

// GET /api/users/:id  (IDOR + fuga de hash)
usersRouter.get('/:id', (req, res) => {
  const r = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as any;
  if (!r) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({
    id: r.id,
    username: r.username,
    email: r.email,
    fullName: r.full_name,
    role: r.role,
    passwordHash: r.password_hash,
    createdAt: r.created_at,
  });
});

// POST /api/users
// Mass assignment / escalada de privilegios (A01 + A08 / CWE-915):
// se acepta el campo 'role' directo del cliente, sin lista blanca ni check de admin.
// Un usuario cualquiera puede crear una cuenta con "role":"admin".
usersRouter.post('/', (req: AuthedRequest, res) => {
  const b = req.body ?? {};
  try {
    const info = db
      .prepare(
        `INSERT INTO users (username, email, full_name, role, password_hash)
         VALUES (@username, @email, @full_name, @role, @password_hash)`
      )
      .run({
        username: b.username,
        email: b.email ?? '',
        full_name: b.fullName ?? b.username,
        role: b.role ?? 'viewer',
        password_hash: hashPassword(String(b.password ?? 'changeme')),
      });
    const r = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid) as any;
    res.status(201).json({
      id: r.id, username: r.username, email: r.email,
      fullName: r.full_name, role: r.role, createdAt: r.created_at,
    });
  } catch (err: any) {
    res.status(400).json({ error: 'No se pudo crear el usuario', detail: String(err?.message ?? err) });
  }
});

// PUT /api/users/:id/role  (cambio de rol sin check de admin -> A01)
usersRouter.put('/:id/role', (req, res) => {
  const b = req.body ?? {};
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(b.role, req.params.id);
  const r = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as any;
  if (!r) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ id: r.id, username: r.username, role: r.role });
});

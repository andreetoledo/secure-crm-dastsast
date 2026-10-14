import { Router } from 'express';
import { db } from '../db';
import { authenticate, AuthedRequest } from '../middleware/auth';

export const ticketsRouter = Router();
ticketsRouter.use(authenticate);

function mapTicket(row: any) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    assigneeId: row.assignee_id,
    assigneeName: row.assignee_name,
    createdById: row.created_by_id,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT = `
  SELECT t.*, a.full_name AS assignee_name, c.full_name AS created_by_name
  FROM tickets t
  LEFT JOIN users a ON a.id = t.assignee_id
  LEFT JOIN users c ON c.id = t.created_by_id
`;

// GET /api/tickets?q=...
// Búsqueda con concatenación de strings (A05 / CWE-89: SQLi de segundo vector).
// El término 'q' se refleja tal cual en el frontend -> habilita XSS reflejado (CWE-79).
// GET /api/tickets?q=...
// Consulta parametrizada segura (mitiga CWE-89: SQL Injection).
// El input del usuario se vincula exclusivamente como dato, neutralizando caracteres de escape.
ticketsRouter.get('/', (req, res) => {
  const q = (req.query.q as string) || '';
  let rows: any[];
  if (q) {
    const term = `%${q}%`;
    const sql = `${SELECT} WHERE t.title LIKE ? OR t.description LIKE ? OR t.customer_name LIKE ? ORDER BY t.created_at DESC`;
    rows = db.prepare(sql).all(term, term, term);
  } else {
    rows = db.prepare(`${SELECT} ORDER BY t.created_at DESC`).all();
  }
  res.json({ query: q, tickets: rows.map(mapTicket) });
});

// GET /api/tickets/:id
// Sin verificación de propiedad ni rol (A01 Broken Access Control / IDOR / CWE-639).
// Cualquier usuario autenticado (incluso 'viewer') lee cualquier ticket por id.
ticketsRouter.get('/:id', (req, res) => {
  const row = db.prepare(`${SELECT} WHERE t.id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Ticket no encontrado' });
  res.json(mapTicket(row));
});

// POST /api/tickets
// Mass assignment: se aceptan campos del cliente sin lista blanca (A08 / CWE-915).
// No se valida el rol: un 'viewer' (solo lectura) puede crear tickets (A01).
ticketsRouter.post('/', (req: AuthedRequest, res) => {
  const b = req.body ?? {};
  const info = db
    .prepare(
      `INSERT INTO tickets (title, description, status, priority, customer_name, customer_email, assignee_id, created_by_id)
       VALUES (@title, @description, @status, @priority, @customer_name, @customer_email, @assignee_id, @created_by_id)`
    )
    .run({
      title: b.title ?? '',
      description: b.description ?? '',
      status: b.status ?? 'open',
      priority: b.priority ?? 'medium',
      customer_name: b.customerName ?? '',
      customer_email: b.customerEmail ?? '',
      assignee_id: b.assigneeId ?? null,
      created_by_id: req.user!.sub,
    });
  const row = db.prepare(`${SELECT} WHERE t.id = ?`).get(info.lastInsertRowid);
  res.status(201).json(mapTicket(row));
});

// PUT /api/tickets/:id
// Sin verificación de propiedad ni rol (A01 / IDOR): un 'viewer' puede editar
// cualquier ticket de cualquier agente.
ticketsRouter.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: 'Ticket no encontrado' });
  const b = req.body ?? {};
  db.prepare(
    `UPDATE tickets SET
       title = @title, description = @description, status = @status, priority = @priority,
       customer_name = @customer_name, customer_email = @customer_email,
       assignee_id = @assignee_id, updated_at = datetime('now')
     WHERE id = @id`
  ).run({
    id: req.params.id,
    title: b.title ?? existing.title,
    description: b.description ?? existing.description,
    status: b.status ?? existing.status,
    priority: b.priority ?? existing.priority,
    customer_name: b.customerName ?? existing.customer_name,
    customer_email: b.customerEmail ?? existing.customer_email,
    assignee_id: b.assigneeId ?? existing.assignee_id,
  });
  const row = db.prepare(`${SELECT} WHERE t.id = ?`).get(req.params.id);
  res.json(mapTicket(row));
});

// DELETE /api/tickets/:id  (sin verificación de rol -> A01)
ticketsRouter.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM tickets WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Ticket no encontrado' });
  res.json({ ok: true });
});

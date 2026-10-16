// Levanta la API real (createApp) sobre una base SQLite en memoria para atacarla con supertest.
process.env.DB_PATH = ':memory:';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'jwt-secret-solo-para-pruebas';

const { db, initSchema } = await import('../apps/api/src/db.ts');
const { hashPassword } = await import('../apps/api/src/hash.ts');
const { createApp } = await import('../apps/api/src/app.ts');
const { default: request } = await import('supertest');

export const JWT_SECRET = process.env.JWT_SECRET;
export const PASSWORDS = { admin: 'Admin123!', agent: 'Password1', viewer: 'viewer' };

initSchema();
const insertUser = db.prepare(
  `INSERT INTO users (username, email, full_name, role, password_hash)
   VALUES (@username, @email, @full_name, @role, @password_hash)`
);
for (const [role, password] of Object.entries(PASSWORDS)) {
  insertUser.run({
    username: role,
    email: `${role}@test.local`,
    full_name: role,
    role,
    password_hash: hashPassword(password),
  });
}
db.prepare(
  `INSERT INTO tickets (title, description, customer_name, customer_email, created_by_id)
   VALUES ('Ticket de prueba', 'Descripcion', 'Cliente', 'cliente@test.local', 1)`
).run();

export { hashPassword };
export const app = createApp();
export const api = () => request(app);

export async function loginAs(role) {
  const res = await api().post('/api/auth/login').send({ username: role, password: PASSWORDS[role] });
  if (res.status !== 200) throw new Error(`No se pudo iniciar sesion como ${role}: ${res.status}`);
  return res.body.token;
}

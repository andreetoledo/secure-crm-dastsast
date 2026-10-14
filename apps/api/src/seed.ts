import { db, initSchema } from './db';
import { hashPassword } from './hash';

initSchema();

console.log('Reiniciando base de datos...');
db.exec('DELETE FROM tickets; DELETE FROM users;');
db.exec("DELETE FROM sqlite_sequence WHERE name IN ('tickets','users');");

const insertUser = db.prepare(
  `INSERT INTO users (username, email, full_name, role, password_hash)
   VALUES (@username, @email, @full_name, @role, @password_hash)`
);

const users = [
  { username: 'admin',   email: 'admin@secure-crm.local',   full_name: 'Ada Administradora', role: 'admin',  password: 'Admin123!' },
  { username: 'jperez',  email: 'jperez@secure-crm.local',  full_name: 'Juan Pérez',         role: 'agent',  password: 'Password1' },
  { username: 'mlopez',  email: 'mlopez@secure-crm.local',  full_name: 'María López',        role: 'agent',  password: 'qwerty123' },
  { username: 'viewer',  email: 'viewer@secure-crm.local',  full_name: 'Víctor Vista',       role: 'viewer', password: 'viewer' },
];

const userIds: Record<string, number> = {};
for (const u of users) {
  const info = insertUser.run({
    username: u.username,
    email: u.email,
    full_name: u.full_name,
    role: u.role,
    password_hash: hashPassword(u.password),
  });
  userIds[u.username] = Number(info.lastInsertRowid);
}

const insertTicket = db.prepare(
  `INSERT INTO tickets (title, description, status, priority, customer_name, customer_email, assignee_id, created_by_id, created_at, updated_at)
   VALUES (@title, @description, @status, @priority, @customer_name, @customer_email, @assignee_id, @created_by_id, @created_at, @updated_at)`
);

const statuses = ['open', 'in_progress', 'closed'];
const priorities = ['low', 'medium', 'high', 'urgent'];
const agents = [userIds['jperez'], userIds['mlopez'], userIds['admin']];

const samples = [
  ['No puedo iniciar sesión en el portal', 'El cliente reporta error 500 al ingresar sus credenciales.'],
  ['Factura duplicada en el estado de cuenta', 'Aparece dos veces el cargo de septiembre.'],
  ['Solicitud de cambio de plan', 'Desea migrar del plan Básico al plan Pro.'],
  ['La app móvil se cierra al abrir reportes', 'Crash constante en Android 14.'],
  ['Error al exportar a PDF', 'El botón de exportar no responde en Safari.'],
  ['Retraso en la entrega del pedido #4821', 'Cliente molesto por 5 días de atraso.'],
  ['Necesito restablecer mi contraseña', 'El correo de recuperación nunca llega.'],
  ['Cobro incorrecto de impuestos', 'El IVA calculado no corresponde a Guatemala.'],
  ['Integración con API falla intermitentemente', 'Timeouts aleatorios en el webhook.'],
  ['Solicito acceso de administrador', 'El gerente pide permisos elevados para su cuenta.'],
  ['Página de checkout muy lenta', 'Tarda más de 20 segundos en cargar.'],
  ['Datos de contacto desactualizados', 'Actualizar teléfono y dirección del cliente.'],
];

const clientes = [
  ['Comercial El Quetzal', 'contacto@elquetzal.gt'],
  ['Tecnología Xela S.A.', 'soporte@texela.gt'],
  ['Distribuidora Antigua', 'ventas@distantigua.gt'],
  ['Cafés de Guatemala', 'info@cafesgt.com'],
  ['Constructora Maya', 'proyectos@cmaya.gt'],
];

let day = 1;
for (let i = 0; i < samples.length; i++) {
  const [title, description] = samples[i];
  const [cn, ce] = clientes[i % clientes.length];
  const created = `2026-08-${String(day).padStart(2, '0')} 09:${String(10 + i).padStart(2, '0')}:00`;
  insertTicket.run({
    title,
    description,
    status: statuses[i % statuses.length],
    priority: priorities[i % priorities.length],
    customer_name: cn,
    customer_email: ce,
    assignee_id: agents[i % agents.length],
    created_by_id: userIds['admin'],
    created_at: created,
    updated_at: created,
  });
  day += 2;
}

console.log('Base de datos poblada:');
console.log(`  - ${users.length} usuarios`);
console.log(`  - ${samples.length} tickets`);
console.log('\nCredenciales de prueba:');
users.forEach((u) => console.log(`  ${u.role.padEnd(7)} ${u.username} / ${u.password}`));

import { initSchema } from './db';
import { createApp } from './app';

initSchema();

const PORT = Number(process.env.API_PORT || 4000);

createApp().listen(PORT, () => {
  console.log(`API secure-crm escuchando en http://localhost:${PORT}`);
});

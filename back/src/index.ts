import { createApp } from './app';
import { ensureSchema, pool } from './db';

const port = Number(process.env.PORT ?? 3001);
const app = createApp(pool);

async function main() {
  try {
    await ensureSchema();
    app.listen(port, () => {
      console.log(`API listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

main();

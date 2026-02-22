import { createApp } from './app';
import { ensureSchema, pool } from './db';
import { PgTasksRepository } from './tasks/tasks.repository';
import { TasksService } from './tasks/tasks.service';

const port = Number(process.env.PORT ?? 3001);
const repository = new PgTasksRepository(pool);
const tasksService = new TasksService(repository);
const app = createApp(tasksService);

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

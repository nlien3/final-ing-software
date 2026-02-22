import cors from 'cors';
import express from 'express';
import { AppError, TasksService } from './tasks/tasks.service';

export function createApp(tasksService: TasksService) {
  const app = express();
  const allowedOrigins = (
    process.env.FRONTEND_URLS ??
    process.env.FRONTEND_URL ??
    'http://localhost:5173,http://localhost:4173'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const localhostOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || localhostOriginPattern.test(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error('Not allowed by CORS'));
      }
    })
  );
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/tasks', async (_req, res, next) => {
    try {
      const tasks = await tasksService.listTasks();
      res.status(200).json(tasks);
    } catch (error) {
      next(error);
    }
  });

  app.post('/tasks', async (req, res, next) => {
    try {
      const task = await tasksService.createTask({
        title: req.body?.title,
        description: req.body?.description
      });
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  });

  app.patch('/tasks/:id', async (req, res, next) => {
    try {
      const task = await tasksService.updateTask(Number(req.params.id), {
        title: req.body?.title,
        description: req.body?.description,
        done: req.body?.done
      });
      res.status(200).json(task);
    } catch (error) {
      next(error);
    }
  });

  app.delete('/tasks/:id', async (req, res, next) => {
    try {
      await tasksService.deleteTask(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }

    console.error(error);
    res.status(500).json({ error: 'internal server error' });
  });

  return app;
}

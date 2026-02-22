import cors from 'cors';
import express from 'express';
import type { Pool } from 'pg';

export function createApp(pool: Pool) {
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
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          localhostOriginPattern.test(origin)
        ) {
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
      const result = await pool.query(
        'SELECT id, title, description, done, created_at AS "createdAt" FROM tasks ORDER BY created_at DESC'
      );
      res.status(200).json(result.rows);
    } catch (error) {
      next(error);
    }
  });

  app.post('/tasks', async (req, res, next) => {
    try {
      const title = String(req.body?.title ?? '').trim();
      const description = String(req.body?.description ?? '').trim();

      if (!title || title.length > 120) {
        res.status(400).json({ error: 'title is required and must be <= 120 chars' });
        return;
      }

      if (!description) {
        res.status(400).json({ error: 'description is required' });
        return;
      }

      if (description.length > 1000) {
        res.status(400).json({ error: 'description must be <= 1000 chars' });
        return;
      }

      const result = await pool.query(
        'INSERT INTO tasks (title, description) VALUES ($1, $2) RETURNING id, title, description, done, created_at AS "createdAt"',
        [title, description]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  });

  app.patch('/tasks/:id', async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const title = req.body?.title;
      const description = req.body?.description;
      const done = req.body?.done;

      if (!Number.isInteger(id)) {
        res.status(400).json({ error: 'invalid payload' });
        return;
      }

      const updates: string[] = [];
      const values: unknown[] = [];

      if (title !== undefined) {
        if (typeof title !== 'string' || !title.trim() || title.trim().length > 120) {
          res.status(400).json({ error: 'title must be 1..120 chars' });
          return;
        }
        updates.push(`title = $${values.length + 1}`);
        values.push(title.trim());
      }

      if (description !== undefined) {
        if (typeof description !== 'string' || !description.trim() || description.trim().length > 1000) {
          res.status(400).json({ error: 'description must be 1..1000 chars' });
          return;
        }
        updates.push(`description = $${values.length + 1}`);
        values.push(description.trim());
      }

      if (done !== undefined) {
        if (typeof done !== 'boolean') {
          res.status(400).json({ error: 'done must be boolean' });
          return;
        }
        updates.push(`done = $${values.length + 1}`);
        values.push(done);
      }

      if (updates.length === 0) {
        res.status(400).json({ error: 'at least one field is required: title, description, done' });
        return;
      }

      values.push(id);
      const idPosition = values.length;
      const result = await pool.query(
        `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${idPosition} RETURNING id, title, description, done, created_at AS "createdAt"`,
        values
      );

      if (result.rowCount === 0) {
        res.status(404).json({ error: 'task not found' });
        return;
      }

      res.status(200).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  });

  app.delete('/tasks/:id', async (req, res, next) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id)) {
        res.status(400).json({ error: 'invalid id' });
        return;
      }

      const result = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);

      if (result.rowCount === 0) {
        res.status(404).json({ error: 'task not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(error);
    res.status(500).json({ error: 'internal server error' });
  });

  return app;
}

import type { Pool } from 'pg';
import type { CreateTaskInput, Task, UpdateTaskInput } from './tasks.types';

export interface TasksRepository {
  list(): Promise<Task[]>;
  create(input: CreateTaskInput): Promise<Task>;
  update(id: number, input: UpdateTaskInput): Promise<Task | null>;
  delete(id: number): Promise<boolean>;
}

export class PgTasksRepository implements TasksRepository {
  constructor(private readonly pool: Pool) {}

  async list(): Promise<Task[]> {
    const result = await this.pool.query(
      'SELECT id, title, description, done, created_at AS "createdAt" FROM tasks ORDER BY created_at DESC'
    );
    return result.rows as Task[];
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const result = await this.pool.query(
      'INSERT INTO tasks (title, description) VALUES ($1, $2) RETURNING id, title, description, done, created_at AS "createdAt"',
      [input.title, input.description]
    );
    return result.rows[0] as Task;
  }

  async update(id: number, input: UpdateTaskInput): Promise<Task | null> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.title !== undefined) {
      updates.push(`title = $${values.length + 1}`);
      values.push(input.title);
    }

    if (input.description !== undefined) {
      updates.push(`description = $${values.length + 1}`);
      values.push(input.description);
    }

    if (input.done !== undefined) {
      updates.push(`done = $${values.length + 1}`);
      values.push(input.done);
    }

    if (updates.length === 0) {
      return null;
    }

    values.push(id);
    const idPosition = values.length;

    const result = await this.pool.query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${idPosition} RETURNING id, title, description, done, created_at AS "createdAt"`,
      values
    );

    return (result.rows[0] as Task | undefined) ?? null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}

import type { CreateTaskInput, Task, UpdateTaskInput } from './tasks.types';
import type { TasksRepository } from './tasks.repository';

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class TasksService {
  constructor(private readonly repository: TasksRepository) {}

  listTasks(): Promise<Task[]> {
    return this.repository.list();
  }

  createTask(input: CreateTaskInput): Promise<Task> {
    const title = String(input.title ?? '').trim();
    const description = String(input.description ?? '').trim();

    if (!title || title.length > 120) {
      throw new AppError('title is required and must be <= 120 chars', 400);
    }

    if (!description) {
      throw new AppError('description is required', 400);
    }

    if (description.length > 1000) {
      throw new AppError('description must be <= 1000 chars', 400);
    }

    return this.repository.create({ title, description });
  }

  async updateTask(id: number, input: UpdateTaskInput): Promise<Task> {
    if (!Number.isInteger(id)) {
      throw new AppError('invalid payload', 400);
    }

    const payload: UpdateTaskInput = {};

    if (input.title !== undefined) {
      if (typeof input.title !== 'string' || !input.title.trim() || input.title.trim().length > 120) {
        throw new AppError('title must be 1..120 chars', 400);
      }
      payload.title = input.title.trim();
    }

    if (input.description !== undefined) {
      if (
        typeof input.description !== 'string' ||
        !input.description.trim() ||
        input.description.trim().length > 1000
      ) {
        throw new AppError('description must be 1..1000 chars', 400);
      }
      payload.description = input.description.trim();
    }

    if (input.done !== undefined) {
      if (typeof input.done !== 'boolean') {
        throw new AppError('done must be boolean', 400);
      }
      payload.done = input.done;
    }

    if (Object.keys(payload).length === 0) {
      throw new AppError('at least one field is required: title, description, done', 400);
    }

    const updated = await this.repository.update(id, payload);

    if (!updated) {
      throw new AppError('task not found', 404);
    }

    return updated;
  }

  async deleteTask(id: number): Promise<void> {
    if (!Number.isInteger(id)) {
      throw new AppError('invalid id', 400);
    }

    const deleted = await this.repository.delete(id);

    if (!deleted) {
      throw new AppError('task not found', 404);
    }
  }
}

import { TasksService } from './tasks.service';
import type { TasksRepository } from './tasks.repository';
import { AppError } from './tasks.service';

function createRepositoryMock(): TasksRepository {
  return {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  };
}

async function expectAsyncAppError(
  promise: Promise<unknown>,
  expectedMessage: string,
  expectedStatusCode: number
) {
  await expect(promise).rejects.toMatchObject({
    name: 'AppError',
    message: expectedMessage,
    statusCode: expectedStatusCode
  });
}

function expectSyncAppError(fn: () => unknown, expectedMessage: string, expectedStatusCode: number) {
  try {
    fn();
    throw new Error('Expected function to throw AppError');
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({
      name: 'AppError',
      message: expectedMessage,
      statusCode: expectedStatusCode
    });
  }
}

describe('TasksService unit', () => {
  it('lists tasks from repository', async () => {
    const repository = createRepositoryMock();
    const service = new TasksService(repository);
    const now = new Date();

    vi.mocked(repository.list).mockResolvedValue([
      { id: 1, title: 'Task', description: 'Desc', done: false, createdAt: now }
    ]);

    const result = await service.listTasks();

    expect(repository.list).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: 1, title: 'Task', description: 'Desc', done: false, createdAt: now }]);
  });

  it('creates task when input is valid', async () => {
    const repository = createRepositoryMock();
    const service = new TasksService(repository);

    const expected = {
      id: 1,
      title: 'Task test',
      description: 'Description test',
      done: false,
      createdAt: new Date()
    };

    vi.mocked(repository.create).mockResolvedValue(expected);

    const result = await service.createTask({ title: ' Task test ', description: ' Description test ' });

    expect(repository.create).toHaveBeenCalledWith({
      title: 'Task test',
      description: 'Description test'
    });
    expect(result).toEqual(expected);
  });

  it('throws when creating task with empty title', () => {
    const repository = createRepositoryMock();
    const service = new TasksService(repository);

    expectSyncAppError(
      () => service.createTask({ title: ' ', description: 'ok' }),
      'title is required and must be <= 120 chars',
      400
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('throws when creating task with title longer than 120 chars', () => {
    const repository = createRepositoryMock();
    const service = new TasksService(repository);
    const longTitle = 'x'.repeat(121);

    expectSyncAppError(
      () => service.createTask({ title: longTitle, description: 'ok' }),
      'title is required and must be <= 120 chars',
      400
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('throws when creating task with empty description', () => {
    const repository = createRepositoryMock();
    const service = new TasksService(repository);

    expectSyncAppError(
      () => service.createTask({ title: 'valid', description: ' ' }),
      'description is required',
      400
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('throws when creating task with description longer than 1000 chars', () => {
    const repository = createRepositoryMock();
    const service = new TasksService(repository);
    const longDescription = 'x'.repeat(1001);

    expectSyncAppError(
      () => service.createTask({ title: 'valid', description: longDescription }),
      'description must be <= 1000 chars',
      400
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('updates task when payload is valid', async () => {
    const repository = createRepositoryMock();
    const service = new TasksService(repository);
    const now = new Date();

    vi.mocked(repository.update).mockResolvedValue({
      id: 10,
      title: 'Task',
      description: 'Desc',
      done: true,
      createdAt: now
    });

    const result = await service.updateTask(10, { done: true });

    expect(repository.update).toHaveBeenCalledWith(10, { done: true });
    expect(result).toEqual({
      id: 10,
      title: 'Task',
      description: 'Desc',
      done: true,
      createdAt: now
    });
  });

  it('throws when update id is not integer', async () => {
    const repository = createRepositoryMock();
    const service = new TasksService(repository);

    await expectAsyncAppError(service.updateTask(1.2, { done: true }), 'invalid payload', 400);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('throws when update payload is empty', async () => {
    const repository = createRepositoryMock();
    const service = new TasksService(repository);

    await expectAsyncAppError(
      service.updateTask(1, {}),
      'at least one field is required: title, description, done',
      400
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('throws when update done is not boolean', async () => {
    const repository = createRepositoryMock();
    const service = new TasksService(repository);

    await expectAsyncAppError(
      service.updateTask(1, { done: 'true' as unknown as boolean }),
      'done must be boolean',
      400
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('throws when update title is invalid', async () => {
    const repository = createRepositoryMock();
    const service = new TasksService(repository);

    await expectAsyncAppError(service.updateTask(1, { title: ' ' }), 'title must be 1..120 chars', 400);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('throws when update description is invalid', async () => {
    const repository = createRepositoryMock();
    const service = new TasksService(repository);

    await expectAsyncAppError(
      service.updateTask(1, { description: ''.padStart(1001, 'x') }),
      'description must be 1..1000 chars',
      400
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('throws 404 when task to update does not exist', async () => {
    const repository = createRepositoryMock();
    const service = new TasksService(repository);

    vi.mocked(repository.update).mockResolvedValue(null);

    await expectAsyncAppError(service.updateTask(999, { title: 'x' }), 'task not found', 404);
    expect(repository.update).toHaveBeenCalledWith(999, { title: 'x' });
  });

  it('throws when delete id is not integer', async () => {
    const repository = createRepositoryMock();
    const service = new TasksService(repository);

    await expectAsyncAppError(service.deleteTask(1.2), 'invalid id', 400);
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('throws 404 when task to delete does not exist', async () => {
    const repository = createRepositoryMock();
    const service = new TasksService(repository);

    vi.mocked(repository.delete).mockResolvedValue(false);

    await expectAsyncAppError(service.deleteTask(999), 'task not found', 404);
  });

  it('deletes task when id exists', async () => {
    const repository = createRepositoryMock();
    const service = new TasksService(repository);

    vi.mocked(repository.delete).mockResolvedValue(true);

    await expect(service.deleteTask(1)).resolves.toBeUndefined();
    expect(repository.delete).toHaveBeenCalledWith(1);
  });
});

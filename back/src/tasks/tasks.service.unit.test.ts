import { TasksService } from './tasks.service';
import type { TasksRepository } from './tasks.repository';

function createRepositoryMock(): TasksRepository {
  return {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  };
}

describe('TasksService unit', () => {
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

    expect(() => service.createTask({ title: ' ', description: 'ok' })).toThrow(
      'title is required and must be <= 120 chars'
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('throws when update payload is empty', async () => {
    const repository = createRepositoryMock();
    const service = new TasksService(repository);

    await expect(service.updateTask(1, {})).rejects.toThrow(
      'at least one field is required: title, description, done'
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('throws 404 when task to update does not exist', async () => {
    const repository = createRepositoryMock();
    const service = new TasksService(repository);

    vi.mocked(repository.update).mockResolvedValue(null);

    await expect(service.updateTask(999, { title: 'x' })).rejects.toThrow('task not found');
  });

  it('throws 404 when task to delete does not exist', async () => {
    const repository = createRepositoryMock();
    const service = new TasksService(repository);

    vi.mocked(repository.delete).mockResolvedValue(false);

    await expect(service.deleteTask(999)).rejects.toThrow('task not found');
  });
});

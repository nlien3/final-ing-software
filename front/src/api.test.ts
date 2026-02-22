import { createTask, deleteTask, getTasks, updateTask } from './api';

describe('api unit', () => {
  const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  it('getTasks returns parsed response', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify([{ id: 1, title: 'A', description: 'B', done: false, createdAt: new Date().toISOString() }]), { status: 200 })
    );

    const result = await getTasks();

    expect(globalThis.fetch).toHaveBeenCalledWith(`${baseUrl}/tasks`, expect.any(Object));
    expect(result).toHaveLength(1);
  });

  it('createTask sends expected payload', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: 2, title: 'X', description: 'Y', done: false, createdAt: new Date().toISOString() }), { status: 201 })
    );

    await createTask('X', 'Y');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${baseUrl}/tasks`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'X', description: 'Y' })
      })
    );
  });

  it('updateTask sends patch payload', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: 1, title: 'X', description: 'Y', done: true, createdAt: new Date().toISOString() }), { status: 200 })
    );

    await updateTask(1, { done: true });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${baseUrl}/tasks/1`,
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  it('deleteTask handles 204 empty response', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(new Response(null, { status: 204 }));

    const result = await deleteTask(10);

    expect(result).toBeUndefined();
  });

  it('throws backend error message on non-ok response', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'boom' }), { status: 400 })
    );

    await expect(createTask('X', 'Y')).rejects.toThrow('boom');
  });
});

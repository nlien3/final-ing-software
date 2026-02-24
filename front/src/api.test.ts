import { createTask, deleteTask, getTasks, updateTask } from './api';

describe('api unit', () => {
  const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

  // Crea un fetch mockeado por test para aislar la capa API y evitar llamadas reales de red.
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  // Verifica que getTasks haga GET /tasks y devuelva la respuesta parseada.
  it('getTasks returns parsed response', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify([{ id: 1, title: 'A', description: 'B', done: false, createdAt: new Date().toISOString() }]), { status: 200 })
    );

    const result = await getTasks();

    expect(globalThis.fetch).toHaveBeenCalledWith(`${baseUrl}/tasks`, expect.any(Object));
    expect(result).toHaveLength(1);
  });

  // Verifica que createTask envie POST /tasks con el payload esperado.
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

  // Verifica que updateTask use PATCH sobre /tasks/:id con el cuerpo correspondiente.
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

  // Verifica que deleteTask maneje correctamente una respuesta 204 (sin contenido).
  it('deleteTask handles 204 empty response', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(new Response(null, { status: 204 }));

    const result = await deleteTask(10);

    expect(result).toBeUndefined();
  });

  // Verifica que, ante error HTTP, se propague el mensaje de error enviado por backend.
  it('throws backend error message on non-ok response', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'boom' }), { status: 400 })
    );

    await expect(createTask('X', 'Y')).rejects.toThrow('boom');
  });
});

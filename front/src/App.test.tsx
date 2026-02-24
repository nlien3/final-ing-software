import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';

const tasksResponse = [
  {
    id: 1,
    title: 'Primera tarea',
    description: 'Descripcion inicial',
    done: false,
    createdAt: new Date().toISOString()
  }
];

describe('App', () => {
  // Prepara un mock de fetch por URL/metodo para simular respuestas del backend en cada test.
  beforeEach(() => {
    globalThis.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith('/tasks') && !init?.method) {
        return Promise.resolve(
          new Response(
            JSON.stringify([
              ...tasksResponse,
              {
                id: 3,
                title: 'Tarea completada',
                description: 'Ya esta lista',
                done: true,
                createdAt: new Date().toISOString()
              }
            ]),
            { status: 200 }
          )
        );
      }

      if (url.endsWith('/tasks') && init?.method === 'POST') {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: 2,
              title: 'Nueva',
              description: 'Nueva descripcion',
              done: false,
              createdAt: new Date().toISOString()
            }),
            { status: 201 }
          )
        );
      }

      if (url.endsWith('/tasks/1') && init?.method === 'PATCH') {
        const parsedBody = JSON.parse(String(init.body ?? '{}'));

        if (parsedBody.done !== undefined) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                id: 1,
                title: 'Primera tarea',
                description: 'Descripcion inicial',
                done: true,
                createdAt: new Date().toISOString()
              }),
              { status: 200 }
            )
          );
        }

        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: 1,
              title: parsedBody.title,
              description: parsedBody.description,
              done: false,
              createdAt: new Date().toISOString()
            }),
            { status: 200 }
          )
        );
      }

      if (url.endsWith('/tasks/1') && init?.method === 'DELETE') {
        return Promise.resolve(new Response(null, { status: 204 }));
      }

      return Promise.resolve(new Response(JSON.stringify({ error: 'Not found' }), { status: 404 }));
    }) as unknown as typeof fetch;
  });

  // Verifica carga inicial: muestra estado de carga y luego renderiza tareas traidas por GET /tasks.
  it('renders and loads tasks', async () => {
    render(<App />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Primera tarea')).toBeInTheDocument();
      expect(screen.getByText('Descripcion inicial')).toBeInTheDocument();
      expect(screen.getByText('Tarea completada')).toBeInTheDocument();
    });
  });

  // Verifica alta de tarea desde el formulario y actualizacion del listado en pantalla.
  it('creates a task', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Primera tarea')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('task-title'), { target: { value: 'Nueva' } });
    fireEvent.change(screen.getByLabelText('task-description'), {
      target: { value: 'Nueva descripcion' }
    });
    fireEvent.click(screen.getByText('Agregar tarea'));

    await waitFor(() => {
      expect(screen.getByText('Nueva')).toBeInTheDocument();
      expect(screen.getByText('Nueva descripcion')).toBeInTheDocument();
    });
  });

  // Verifica edicion por modal: abre, cambia campos y guarda cambios.
  it('edits a task through modal', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Editar tarea' }).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Editar tarea' })[0]);
    fireEvent.change(screen.getByLabelText('modal-edit-title'), {
      target: { value: 'Titulo editado' }
    });
    fireEvent.change(screen.getByLabelText('modal-edit-description'), {
      target: { value: 'Descripcion editada' }
    });
    fireEvent.click(screen.getByText('Guardar cambios'));

    await waitFor(() => {
      expect(screen.getByText('Titulo editado')).toBeInTheDocument();
      expect(screen.getByText('Descripcion editada')).toBeInTheDocument();
    });
  });

  // Verifica borrado con confirmacion: abre modal de eliminar y remueve la tarea al confirmar.
  it('deletes a task through confirmation modal', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Eliminar tarea' }).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Eliminar tarea' })[0]);
    expect(screen.getByText('Eliminar tarea')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Si, borrar'));

    await waitFor(() => {
      expect(screen.queryByText('Primera tarea')).not.toBeInTheDocument();
    });
  });

  // Verifica filtro de estado: pendientes/completadas muestran solo las tareas correspondientes.
  it('filters tasks by status', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Primera tarea')).toBeInTheDocument();
      expect(screen.getByText('Tarea completada')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Pendientes'));
    expect(screen.getByText('Primera tarea')).toBeInTheDocument();
    expect(screen.queryByText('Tarea completada')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Completadas'));
    expect(screen.queryByText('Primera tarea')).not.toBeInTheDocument();
    expect(screen.getByText('Tarea completada')).toBeInTheDocument();
  });

  // Verifica validacion local del formulario cuando titulo y descripcion llegan vacios.
  it('shows validation error when creating task with blank fields', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Primera tarea')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('task-title'), { target: { value: '   ' } });
    fireEvent.change(screen.getByLabelText('task-description'), { target: { value: '   ' } });
    fireEvent.click(screen.getByText('Agregar tarea'));

    expect(screen.getByText('El titulo y la descripcion son obligatorios')).toBeInTheDocument();
  });

  // Verifica cambio de estado done desde el checkbox en el listado.
  it('toggles task completion from checkbox', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Primera tarea')).toBeInTheDocument();
    });

    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(screen.getByText('Primera tarea')).toHaveClass('done');
    });
  });

  // Verifica proteccion ante salida de modal de edicion con cambios sin guardar.
  it('opens discard changes confirmation and exits edit without saving', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Editar tarea' }).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Editar tarea' })[0]);
    fireEvent.change(screen.getByLabelText('modal-edit-title'), {
      target: { value: 'Cambio sin guardar' }
    });
    fireEvent.click(screen.getByText('Cancelar'));

    expect(screen.getByText('Descartar cambios')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Salir sin guardar'));

    await waitFor(() => {
      expect(screen.queryByText('Descartar cambios')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('modal-edit-title')).not.toBeInTheDocument();
      expect(screen.getByText('Primera tarea')).toBeInTheDocument();
    });
  });

  // Verifica UX: el modal de eliminar se cierra al presionar Escape.
  it('closes delete modal when pressing Escape', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Eliminar tarea' }).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Eliminar tarea' })[0]);
    expect(screen.getByText('Eliminar tarea')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByText('Eliminar tarea')).not.toBeInTheDocument();
    });
  });
});

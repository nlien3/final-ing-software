import { FormEvent, MouseEvent, useEffect, useState } from 'react';
import { createTask, deleteTask, getTasks, updateTask } from './api';
import type { Task } from './types';

type ConfirmAction = 'discard-edit' | null;
type TaskFilter = 'all' | 'pending' | 'done';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return;
      }

      if (confirmAction) {
        setConfirmAction(null);
        return;
      }

      if (taskToDelete) {
        setTaskToDelete(null);
        return;
      }

      if (editingTask) {
        closeEditModal();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmAction, taskToDelete, editingTask, closeEditModal]);

  async function loadTasks() {
    try {
      setLoading(true);
      const data = await getTasks();
      setTasks(data);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !description.trim()) {
      setError('El titulo y la descripcion son obligatorios');
      return;
    }

    try {
      const task = await createTask(title.trim(), description.trim());
      setTasks((prev) => [task, ...prev]);
      setTitle('');
      setDescription('');
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function onToggle(task: Task) {
    try {
      const updatedTask = await updateTask(task.id, { done: !task.done });
      setTasks((prev) => prev.map((item) => (item.id === task.id ? updatedTask : item)));
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function openEditModal(task: Task) {
    setEditingTask(task);
    setEditingTitle(task.title);
    setEditingDescription(task.description);
  }

  function hasUnsavedChanges() {
    if (!editingTask) {
      return false;
    }

    return (
      editingTitle.trim() !== editingTask.title ||
      editingDescription.trim() !== editingTask.description
    );
  }

  function resetEditModal() {
    setEditingTask(null);
    setEditingTitle('');
    setEditingDescription('');
  }

  function closeEditModal() {
    if (hasUnsavedChanges()) {
      setConfirmAction('discard-edit');
      return;
    }

    resetEditModal();
  }

  function onOverlayMouseDown(
    event: MouseEvent<HTMLDivElement>,
    onClose: () => void
  ) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  async function saveEdit() {
    if (!editingTask) {
      return;
    }

    if (!editingTitle.trim()) {
      setError('El titulo es obligatorio');
      return;
    }

    if (!editingDescription.trim()) {
      setError('La descripcion es obligatoria');
      return;
    }

    try {
      const updatedTask = await updateTask(editingTask.id, {
        title: editingTitle.trim(),
        description: editingDescription.trim()
      });

      setTasks((prev) => prev.map((item) => (item.id === editingTask.id ? updatedTask : item)));
      resetEditModal();
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function confirmDelete() {
    if (!taskToDelete) {
      return;
    }
    try {
      await deleteTask(taskToDelete.id);
      setTasks((prev) => prev.filter((item) => item.id !== taskToDelete.id));
      setTaskToDelete(null);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function runConfirmedAction() {
    if (confirmAction === 'discard-edit') {
      resetEditModal();
      setError('');
    }

    setConfirmAction(null);
  }

  const filteredTasks = tasks.filter((task) => {
    if (taskFilter === 'pending') {
      return !task.done;
    }
    if (taskFilter === 'done') {
      return task.done;
    }
    return true;
  });

  return (
    <main className="container">
      <h1>Task Manager v Final 2 Cambio</h1>
      <p className="subtitle">CRUD basico con titulo, descripcion, edicion y fecha de creacion.</p>

      <form onSubmit={onSubmit} className="create-form">
        <input
          aria-label="task-title"
          placeholder="Titulo"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
        <textarea
          aria-label="task-description"
          placeholder="Descripcion"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          required
        />
        <button type="submit">Agregar tarea</button>
      </form>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <div className="filter-bar" role="group" aria-label="Filtro de tareas">
            <button
              type="button"
              className={`filter-btn ${taskFilter === 'all' ? 'active' : ''}`}
              onClick={() => setTaskFilter('all')}
            >
              Todas
            </button>
            <button
              type="button"
              className={`filter-btn ${taskFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setTaskFilter('pending')}
            >
              Pendientes
            </button>
            <button
              type="button"
              className={`filter-btn ${taskFilter === 'done' ? 'active' : ''}`}
              onClick={() => setTaskFilter('done')}
            >
              Completadas
            </button>
          </div>

          <ul className="task-list">
            {filteredTasks.map((task) => (
            <li key={task.id} className="task-item">
              <div className="task-header">
                <label className="check-label">
                  <input type="checkbox" checked={task.done} onChange={() => onToggle(task)} />
                  <span className={task.done ? 'done' : ''}>{task.title}</span>
                </label>
                <small>{new Date(task.createdAt).toLocaleString()}</small>
              </div>

              <p className="description">{task.description || 'Sin descripcion'}</p>

              <div className="actions task-actions">
                <button
                  type="button"
                  className="icon-btn icon-edit"
                  aria-label="Editar tarea"
                  onClick={() => openEditModal(task)}
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M4 20h4l10-10-4-4L4 16v4Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 6l4 4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="sr-only">Editar</span>
                </button>
                <button
                  type="button"
                  className="icon-btn icon-delete"
                  aria-label="Eliminar tarea"
                  onClick={() => setTaskToDelete(task)}
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M5 7h14"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M9 7V5h6v2M9 11v6M15 11v6M7 7l1 12h8l1-12"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="sr-only">Borrar</span>
                </button>
              </div>
            </li>
            ))}
            {filteredTasks.length === 0 && <li className="empty-state">No hay tareas para este filtro.</li>}
          </ul>
        </>
      )}

      {editingTask && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Editar tarea modal"
          onMouseDown={(event) => onOverlayMouseDown(event, closeEditModal)}
        >
          <div className="modal-card">
            <h2>Editar tarea</h2>
            <input
              aria-label="modal-edit-title"
              value={editingTitle}
              onChange={(event) => setEditingTitle(event.target.value)}
              required
            />
            <textarea
              aria-label="modal-edit-description"
              value={editingDescription}
              onChange={(event) => setEditingDescription(event.target.value)}
              rows={4}
              required
            />
            <div className="actions">
              <button type="button" className="warning" onClick={saveEdit}>
                Guardar cambios
              </button>
              <button type="button" className="ghost" onClick={closeEditModal}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {taskToDelete && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Eliminar tarea modal"
          onMouseDown={(event) => onOverlayMouseDown(event, () => setTaskToDelete(null))}
        >
          <div className="modal-card">
            <h2>Eliminar tarea</h2>
            <p>
              Vas a eliminar <strong>{taskToDelete.title}</strong>. Esta accion no se puede deshacer.
            </p>
            <div className="actions">
              <button type="button" className="danger" onClick={confirmDelete}>
                Si, borrar
              </button>
              <button type="button" className="ghost" onClick={() => setTaskToDelete(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar accion modal"
          onMouseDown={(event) => onOverlayMouseDown(event, () => setConfirmAction(null))}
        >
          <div className="modal-card confirm-card">
            <h2>Descartar cambios</h2>
            <p>Tenes cambios sin guardar. Si salis ahora, se perderan.</p>
            <div className="actions">
              <button type="button" className="danger" onClick={runConfirmedAction}>
                Salir sin guardar
              </button>
              <button type="button" className="ghost" onClick={() => setConfirmAction(null)}>
                Volver a editar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

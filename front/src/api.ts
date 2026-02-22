import type { Task } from './types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getTasks(): Promise<Task[]> {
  return request<Task[]>('/tasks');
}

export function createTask(title: string, description: string): Promise<Task> {
  return request<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify({ title, description })
  });
}

type TaskUpdatePayload = {
  title?: string;
  description?: string;
  done?: boolean;
};

export function updateTask(taskId: number, payload: TaskUpdatePayload): Promise<Task> {
  return request<Task>(`/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export function deleteTask(taskId: number): Promise<void> {
  return request<void>(`/tasks/${taskId}`, {
    method: 'DELETE'
  });
}

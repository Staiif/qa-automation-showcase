import type { Session, Task } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error ?? `Erreur ${res.status}`, res.status);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export function apiLogin(email: string, password: string): Promise<Session> {
  return request<Session>('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function fetchTasks(token: string): Promise<Task[]> {
  return request<Task[]>('/api/tasks', { token });
}

export function createTask(token: string, title: string): Promise<Task> {
  return request<Task>('/api/tasks', {
    method: 'POST',
    token,
    body: JSON.stringify({ title }),
  });
}

export function patchTask(
  token: string,
  id: string,
  patch: Partial<Pick<Task, 'done' | 'title'>>,
): Promise<Task> {
  return request<Task>(`/api/tasks/${id}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(patch),
  });
}

export function deleteTask(token: string, id: string): Promise<void> {
  return request<void>(`/api/tasks/${id}`, { method: 'DELETE', token });
}

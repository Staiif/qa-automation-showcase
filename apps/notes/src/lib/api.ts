import type { Note, Session } from '../types';

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

export function fetchNotes(token: string): Promise<Note[]> {
  return request<Note[]>('/api/notes', { token });
}

export function createNote(token: string, text: string): Promise<Note> {
  return request<Note>('/api/notes', {
    method: 'POST',
    token,
    body: JSON.stringify({ text }),
  });
}

export function deleteNote(token: string, id: string): Promise<void> {
  return request<void>(`/api/notes/${id}`, { method: 'DELETE', token });
}

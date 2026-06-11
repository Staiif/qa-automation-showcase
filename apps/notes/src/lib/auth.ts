import type { Session } from '../types';
import { apiLogin, ApiError } from './api';

const SESSION_KEY = 'notes.session';

export class AuthError extends Error {}

export async function signIn(email: string, password: string): Promise<Session> {
  try {
    const session = await apiLogin(email, password);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      throw new AuthError(err.message);
    }
    throw err;
  }
}

export function getSession(): Session | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function signOut(): void {
  localStorage.removeItem(SESSION_KEY);
}

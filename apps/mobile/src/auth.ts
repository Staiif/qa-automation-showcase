export interface Session {
  email: string;
}

const DEMO_EMAIL = 'demo@taskly.app';
const DEMO_PASSWORD = 'password123';

export class AuthError extends Error {}

/** Mirrors the web app's demo auth so both suites share credentials. */
export async function signIn(email: string, password: string): Promise<Session> {
  await new Promise((r) => setTimeout(r, 150));
  if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
    throw new AuthError('Email ou mot de passe invalide.');
  }
  return { email: DEMO_EMAIL };
}

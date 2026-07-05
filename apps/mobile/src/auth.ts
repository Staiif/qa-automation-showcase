import { isEnabled } from './e2e/detoxStudioLogger';

export interface Session {
  email: string;
}

const DEMO_EMAIL = 'demo@taskly.app';
const DEMO_PASSWORD = 'password123';

export class AuthError extends Error {}

/** Mirrors the web app's demo auth so both suites share credentials. */
export async function signIn(email: string, password: string): Promise<Session> {
  await new Promise((r) => setTimeout(r, 150));
  // Telemetry-style ping so the demo exercises a real network call
  // (10.0.2.2 = host loopback from the Android emulator). Only fires in
  // E2E launches — isEnabled() is false in normal dev sessions.
  if (isEnabled()) {
    fetch('http://10.0.2.2:3001/health').catch(() => {});
  }
  if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
    console.warn(`[auth] sign-in rejected for ${email.trim() || '<empty>'}`);
    throw new AuthError('Email ou mot de passe invalide.');
  }
  return { email: DEMO_EMAIL };
}

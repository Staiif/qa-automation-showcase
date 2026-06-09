// Ensure the .env is loaded before we read any process.env value.
import './load-env.js';

/**
 * Configuration loaded entirely from the environment.
 *
 * Test accounts are NEVER hard-coded in source — they live in `.env`
 * (git-ignored) locally and in CI secrets / env in the pipeline. We fail fast
 * with a clear message if a required value is missing.
 */

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variable d'environnement manquante : ${name}. ` +
        `Copiez .env.example vers .env (cp .env.example .env) puis renseignez-la.`,
    );
  }
  return value;
}

/**
 * Demo users come from the environment. Two supported shapes:
 *   1. TASKLY_USERS = '[{"email":"a@b.co","password":"…"}, …]' (JSON)
 *   2. TASKLY_DEMO_EMAIL + TASKLY_DEMO_PASSWORD (single user, convenience)
 */
function loadUsers() {
  if (process.env.TASKLY_USERS) {
    try {
      const parsed = JSON.parse(process.env.TASKLY_USERS);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      throw new Error('TASKLY_USERS doit être un tableau JSON valide.');
    }
  }
  return [
    {
      email: required('TASKLY_DEMO_EMAIL'),
      password: required('TASKLY_DEMO_PASSWORD'),
    },
  ];
}

export const config = {
  port: Number(process.env.API_PORT ?? 3001),
  users: loadUsers(),
  // Guards the destructive test-support endpoints so they can never be hit
  // by accident in a real environment.
  testSupportSecret: process.env.TEST_SUPPORT_SECRET ?? '',
};

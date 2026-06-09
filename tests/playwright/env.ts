import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Load the repo-root .env so credentials come from the environment, never
// from source. CI provides these via secrets / `cp .env.example .env`.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variable d'environnement manquante : ${name}. ` +
        `Lancez : cp .env.example .env`,
    );
  }
  return value;
}

// Use `||` (not `??`) so an empty string in .env falls back to the default.
export const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';
export const BASE_URL = process.env.BASE_URL || 'http://localhost:4173';
export const TEST_SECRET = required('TEST_SUPPORT_SECRET');

export const DEMO_USER = {
  email: required('TASKLY_DEMO_EMAIL'),
  password: required('TASKLY_DEMO_PASSWORD'),
} as const;

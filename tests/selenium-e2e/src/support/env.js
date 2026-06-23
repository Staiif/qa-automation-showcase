import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { requireEnv } from '@taskly/e2e-core';

// Load the repo-root .env so credentials come from the environment, never from
// source — exactly like tests/playwright/env.ts. CI provides these via secrets
// (`cp .env.example .env`).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

// Use `||` (not `??`) so an empty string in .env falls back to the default.
export const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';
export const BASE_URL = process.env.BASE_URL || 'http://localhost:4173';
export const TEST_SECRET = requireEnv('TEST_SUPPORT_SECRET');

export const DEMO_USER = {
  email: requireEnv('TASKLY_DEMO_EMAIL'),
  password: requireEnv('TASKLY_DEMO_PASSWORD'),
};

// A worker-scoped account (`demo+wN@…`, the convention the API accepts), mirroring
// makeAuthFixtures on the Playwright side. Index 99 keeps this suite's data clear
// of the Playwright workers (w0..w15) even against a shared backend.
const [local, domain] = DEMO_USER.email.split('@');
const workerIndex = process.env.SELENIUM_WORKER || '99';
export const WORKER = {
  email: `${local}+w${workerIndex}@${domain}`,
  password: DEMO_USER.password,
};

export const SESSION_KEY = 'taskly.session';

// Headless by default; `HEADLESS=0` (or false/no) opens a real browser window.
export const HEADLESS = !/^(0|false|no)$/i.test(process.env.HEADLESS ?? '');

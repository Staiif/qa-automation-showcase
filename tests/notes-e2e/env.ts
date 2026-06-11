import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { requireEnv } from '@taskly/e2e-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';
export const BASE_URL = process.env.NOTES_BASE_URL || 'http://localhost:4174';
export const TEST_SECRET = requireEnv('TEST_SUPPORT_SECRET');

export const DEMO_USER = {
  email: requireEnv('TASKLY_DEMO_EMAIL'),
  password: requireEnv('TASKLY_DEMO_PASSWORD'),
} as const;

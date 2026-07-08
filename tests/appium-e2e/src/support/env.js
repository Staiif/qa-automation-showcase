import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Load the repo-root .env so credentials come from the environment, never source
// (same convention as every other suite). This project is standalone (not a
// workspace), so e2e-core isn't symlinked — we keep a tiny local requireEnv.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../../..');
dotenv.config({ path: path.join(repoRoot, '.env') });

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement manquante : ${name}. Lancez : cp .env.example .env`);
  }
  return value;
}

// The RN app's auth is a local stub that accepts the demo credentials (see
// apps/mobile/src/auth.ts) — the same account as the web app.
export const DEMO_USER = {
  email: requireEnv('TASKLY_DEMO_EMAIL'),
  password: requireEnv('TASKLY_DEMO_PASSWORD'),
};

export const APP_ID = process.env.ANDROID_APP_ID || 'com.taskly';
export const APP_ACTIVITY = process.env.ANDROID_APP_ACTIVITY || 'com.taskly.MainActivity';
export const DEVICE = process.env.ANDROID_DEVICE || 'emulator-5554';
// If set, Appium boots this AVD itself (handy locally); in CI the emulator is
// already running, so we leave it empty and just attach to the device.
export const AVD = process.env.ANDROID_AVD || '';

export const APP_PATH =
  process.env.APP_PATH ||
  path.join(repoRoot, 'apps/mobile/android/app/build/outputs/apk/release/app-release.apk');
export const APP_PATH_EXISTS = existsSync(APP_PATH);

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { API_URL, BASE_URL } from './env.js';

/**
 * Mocha global fixtures that boot the API + the production web preview before the
 * suite and tear them down after — the same idea as Playwright's `webServer`, so
 * Selenium runs against the artifacts that ship. Set BASE_URL to target an
 * already-running deployment (skips the servers entirely).
 */
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../..',
);
const useExternalTarget = !!process.env.BASE_URL;
const children = [];

function startBackground(command, args) {
  const child = spawn(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    detached: true, // own process group, so we can kill the whole tree on teardown
    env: process.env,
  });
  children.push(child);
  return child;
}

function runToCompletion(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: repoRoot, stdio: 'inherit', env: process.env });
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`\`${command} ${args.join(' ')}\` exited ${code}`)),
    );
  });
}

async function waitForHttp(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return; // up and answering (200 health, 200 index, …)
    } catch {
      /* not listening yet */
    }
    if (Date.now() > deadline) throw new Error(`Timed out waiting for ${url}`);
    await new Promise((r) => setTimeout(r, 500));
  }
}

export async function mochaGlobalSetup() {
  if (useExternalTarget) {
    console.log(`[selenium] BASE_URL set → using external target ${BASE_URL}`);
    return;
  }
  console.log('[selenium] booting API + web preview…');
  startBackground('npm', ['run', 'api:start']);
  await waitForHttp(`${API_URL}/health`, 60_000);

  await runToCompletion('npm', ['run', 'web:build']);
  startBackground('npm', ['run', 'web:preview']);
  await waitForHttp(BASE_URL, 120_000);
  console.log('[selenium] stack ready.');
}

export async function mochaGlobalTeardown() {
  for (const child of children) {
    try {
      process.kill(-child.pid, 'SIGTERM'); // negative pid → kill the process group
    } catch {
      /* already exited */
    }
  }
}

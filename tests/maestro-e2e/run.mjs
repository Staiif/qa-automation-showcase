#!/usr/bin/env node
/**
 * Lance `maestro test` sur le workspace, avec les comptes du `.env` racine
 * injectés en variables de flow (${EMAIL} / ${PASSWORD}).
 *
 * Zéro dépendance npm : le .env est parsé à la main, Maestro fait le reste.
 *
 * Usage :
 *   npm test                      # toute la suite
 *   npm test -- --include-tags auth   # args supplémentaires passés à maestro
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const suiteDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(suiteDir, '../..');

/** Parse minimaliste d'un fichier .env (KEY=VALUE, commentaires #). */
function loadEnv(file) {
  if (!existsSync(file)) return {};
  return Object.fromEntries(
    readFileSync(file, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const i = line.indexOf('=');
        return [line.slice(0, i), line.slice(i + 1).replace(/^["']|["']$/g, '')];
      }),
  );
}

const env = { ...loadEnv(join(rootDir, '.env')), ...process.env };
const email = env.TASKLY_DEMO_EMAIL;
const password = env.TASKLY_DEMO_PASSWORD;

if (!email || !password) {
  console.error(
    'TASKLY_DEMO_EMAIL / TASKLY_DEMO_PASSWORD manquants — renseignez le .env racine (voir .env.example).',
  );
  process.exit(1);
}

const reportsDir = join(suiteDir, 'reports');
mkdirSync(join(reportsDir, 'debug'), { recursive: true });

const args = [
  'test',
  '--env', `EMAIL=${email}`,
  '--env', `PASSWORD=${password}`,
  '--format', 'junit',
  '--output', join(reportsDir, 'maestro.xml'),
  '--debug-output', join(reportsDir, 'debug'),
  ...process.argv.slice(2), // ex. --include-tags auth
  '.',
];

const result = spawnSync('maestro', args, { cwd: suiteDir, stdio: 'inherit', env });

if (result.error?.code === 'ENOENT') {
  console.error(
    'CLI `maestro` introuvable — installez-le : curl -Ls https://get.maestro.mobile.dev | bash',
  );
  process.exit(1);
}
process.exit(result.status ?? 1);

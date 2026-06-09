import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';

// Side-effect module: loads the repo-root .env. Importing this FIRST (before
// any module that reads process.env) guarantees env vars are populated —
// static ESM imports are evaluated before top-level code, so the loading must
// itself live in an imported module.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

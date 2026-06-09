import './load-env.js'; // loads repo-root .env before anything reads process.env
import express from 'express';
import { config } from './config.js';
import {
  addTask,
  listTasks,
  removeTask,
  resetAll,
  resetUser,
  updateTask,
} from './store.js';

const app = express();
app.use(express.json());

// --- CORS (the web app is served from a different origin) ------------------
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-test-secret');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

function tokenFor(email) {
  return `tok_${Buffer.from(email).toString('base64')}`;
}

function emailFromToken(token) {
  if (!token?.startsWith('tok_')) return null;
  try {
    return Buffer.from(token.slice(4), 'base64').toString('utf8');
  } catch {
    return null;
  }
}

// Primary account + a convention for worker-scoped test accounts of the form
// `<local>+w<N>@<domain>` (same password). This lets parallel test workers each
// own an isolated data namespace without listing every account in the env.
const primary = config.users[0];
const [pLocal, pDomain] = primary.email.toLowerCase().split('@');

function isWorkerEmail(email) {
  const m = String(email).toLowerCase().match(/^(.+)\+w\d+@(.+)$/);
  return !!m && m[1] === pLocal && m[2] === pDomain;
}

function isKnownEmail(email) {
  const e = String(email ?? '').toLowerCase();
  return config.users.some((u) => u.email.toLowerCase() === e) || isWorkerEmail(e);
}

function authenticate(email, password) {
  const e = String(email ?? '').trim().toLowerCase();
  const exact = config.users.find((u) => u.email.toLowerCase() === e);
  if (exact) return exact.password === password ? exact.email : null;
  if (isWorkerEmail(e) && password === primary.password) return e;
  return null;
}

// --- Auth middleware -------------------------------------------------------
function requireAuth(req, res, next) {
  const header = req.get('authorization') ?? '';
  const email = emailFromToken(header.replace(/^Bearer\s+/i, ''));
  if (!email || !isKnownEmail(email)) {
    return res.status(401).json({ error: 'Non authentifié.' });
  }
  req.userEmail = email;
  next();
}

// --- Health ----------------------------------------------------------------
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// --- Auth ------------------------------------------------------------------
app.post('/api/login', (req, res) => {
  const { email, password } = req.body ?? {};
  const authed = authenticate(email, password);
  if (!authed) {
    return res.status(401).json({ error: 'Email ou mot de passe invalide.' });
  }
  res.json({ email: authed, token: tokenFor(authed) });
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ email: req.userEmail });
});

// --- Tasks -----------------------------------------------------------------
app.get('/api/tasks', requireAuth, (req, res) => {
  res.json(listTasks(req.userEmail));
});

app.post('/api/tasks', requireAuth, (req, res) => {
  const title = String(req.body?.title ?? '').trim();
  if (!title) return res.status(400).json({ error: 'Titre requis.' });
  res.status(201).json(addTask(req.userEmail, title));
});

app.patch('/api/tasks/:id', requireAuth, (req, res) => {
  const task = updateTask(req.userEmail, req.params.id, req.body ?? {});
  if (!task) return res.status(404).json({ error: 'Tâche introuvable.' });
  res.json(task);
});

app.delete('/api/tasks/:id', requireAuth, (req, res) => {
  const ok = removeTask(req.userEmail, req.params.id);
  if (!ok) return res.status(404).json({ error: 'Tâche introuvable.' });
  res.status(204).end();
});

// --- Test support (teardown / fixtures) ------------------------------------
// Destructive — guarded by a secret. With a valid bearer token it resets only
// that user's data (per-worker isolation); without one it wipes everything.
app.post('/api/test/reset', (req, res) => {
  if (
    !config.testSupportSecret ||
    req.get('x-test-secret') !== config.testSupportSecret
  ) {
    return res.status(403).json({ error: 'Interdit.' });
  }
  const email = emailFromToken(
    (req.get('authorization') ?? '').replace(/^Bearer\s+/i, ''),
  );
  if (email && isKnownEmail(email)) {
    resetUser(email);
    return res.json({ status: 'reset', scope: email });
  }
  resetAll();
  res.json({ status: 'reset', scope: 'all' });
});

const server = app.listen(config.port, () => {
  console.log(`Taskly API en écoute sur http://localhost:${config.port}`);
});

// Graceful shutdown so the Playwright webServer can stop it cleanly.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}

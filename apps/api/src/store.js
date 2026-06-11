/**
 * In-memory data store, keyed by user email. A real service would use a
 * database; the shape and the reset hook are what matter for the test suite.
 */
const tasksByUser = new Map();
const notesByUser = new Map();
let seq = 0;

export function listTasks(email) {
  return tasksByUser.get(email) ?? [];
}

export function addTask(email, title) {
  const task = {
    id: `t${++seq}`,
    title,
    done: false,
    createdAt: Date.now(),
  };
  const tasks = tasksByUser.get(email) ?? [];
  tasks.unshift(task);
  tasksByUser.set(email, tasks);
  return task;
}

export function updateTask(email, id, patch) {
  const tasks = tasksByUser.get(email) ?? [];
  const task = tasks.find((t) => t.id === id);
  if (!task) return null;
  if (typeof patch.done === 'boolean') task.done = patch.done;
  if (typeof patch.title === 'string') task.title = patch.title;
  return task;
}

export function removeTask(email, id) {
  const tasks = tasksByUser.get(email) ?? [];
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  tasks.splice(idx, 1);
  return true;
}

// --- Notes (second app sharing the same backend & e2e-core) ----------------
export function listNotes(email) {
  return notesByUser.get(email) ?? [];
}

export function addNote(email, text) {
  const note = { id: `n${++seq}`, text, createdAt: Date.now() };
  const notes = notesByUser.get(email) ?? [];
  notes.unshift(note);
  notesByUser.set(email, notes);
  return note;
}

export function removeNote(email, id) {
  const notes = notesByUser.get(email) ?? [];
  const idx = notes.findIndex((n) => n.id === id);
  if (idx === -1) return false;
  notes.splice(idx, 1);
  return true;
}

/** Wipes one user's data — used for per-worker test isolation. */
export function resetUser(email) {
  tasksByUser.delete(email);
  notesByUser.delete(email);
}

/** Wipes all data — used by the test-support teardown endpoint. */
export function resetAll() {
  tasksByUser.clear();
  notesByUser.clear();
  seq = 0;
}

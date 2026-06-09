import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  createTask,
  deleteTask,
  fetchTasks,
  patchTask,
} from '../lib/api';
import type { Filter, Session, Task } from '../types';

interface Props {
  session: Session;
  onSignOut: () => void;
}

export function TaskBoard({ session, onSignOut }: Props) {
  const { token } = session;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load the user's tasks from the API on mount.
  useEffect(() => {
    let active = true;
    fetchTasks(token)
      .then((data) => active && setTasks(data))
      .catch(() => active && setError('Impossible de charger les tâches.'));
    return () => {
      active = false;
    };
  }, [token]);

  const activeCount = useMemo(
    () => tasks.filter((t) => !t.done).length,
    [tasks],
  );

  const visible = useMemo(() => {
    switch (filter) {
      case 'active':
        return tasks.filter((t) => !t.done);
      case 'done':
        return tasks.filter((t) => t.done);
      default:
        return tasks;
    }
  }, [tasks, filter]);

  async function addTask(event: FormEvent) {
    event.preventDefault();
    const title = draft.trim();
    if (!title) return;
    setDraft('');
    const task = await createTask(token, title);
    setTasks((prev) => [task, ...prev]);
  }

  async function toggle(task: Task) {
    const updated = await patchTask(token, task.id, { done: !task.done });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
  }

  async function remove(id: string) {
    await deleteTask(token, id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <main className="card" aria-labelledby="board-title">
      <header className="board-header">
        <h1 id="board-title">Mes tâches</h1>
        <div className="user">
          <span data-testid="user-email">{session.email}</span>
          <button
            type="button"
            className="link"
            data-testid="logout-button"
            onClick={onSignOut}
          >
            Se déconnecter
          </button>
        </div>
      </header>

      {error && (
        <p className="error" role="alert" data-testid="board-error">
          {error}
        </p>
      )}

      <form className="new-task" onSubmit={addTask}>
        <label className="sr-only" htmlFor="new-task">
          Nouvelle tâche
        </label>
        <input
          id="new-task"
          data-testid="new-task-input"
          placeholder="Ajouter une tâche…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" data-testid="add-task-button">
          Ajouter
        </button>
      </form>

      <div className="filters" role="group" aria-label="Filtrer les tâches">
        <button
          type="button"
          aria-pressed={filter === 'all'}
          className={filter === 'all' ? 'active' : ''}
          data-testid="filter-all"
          onClick={() => setFilter('all')}
        >
          Toutes
        </button>
        <button
          type="button"
          aria-pressed={filter === 'active'}
          className={filter === 'active' ? 'active' : ''}
          data-testid="filter-active"
          onClick={() => setFilter('active')}
        >
          À faire
        </button>
        <button
          type="button"
          aria-pressed={filter === 'done'}
          className={filter === 'done' ? 'active' : ''}
          data-testid="filter-done"
          onClick={() => setFilter('done')}
        >
          Terminées
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="muted" data-testid="empty-state">
          Aucune tâche ici. 🎉
        </p>
      ) : (
        <ul className="task-list">
          {visible.map((task) => (
            <li key={task.id} className="task-item" data-testid="task-item">
              <label className="task-label">
                <input
                  type="checkbox"
                  data-testid="task-checkbox"
                  checked={task.done}
                  onChange={() => toggle(task)}
                />
                <span
                  className={task.done ? 'done' : ''}
                  data-testid="task-title"
                >
                  {task.title}
                </span>
              </label>
              <button
                type="button"
                className="link danger"
                data-testid="task-delete"
                aria-label={`Supprimer ${task.title}`}
                onClick={() => remove(task.id)}
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}

      <footer className="board-footer">
        <span data-testid="active-count">
          {activeCount} tâche{activeCount > 1 ? 's' : ''} à faire
        </span>
      </footer>
    </main>
  );
}

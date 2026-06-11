import { useEffect, useState, type FormEvent } from 'react';
import { createNote, deleteNote, fetchNotes } from '../lib/api';
import type { Note, Session } from '../types';

interface Props {
  session: Session;
  onSignOut: () => void;
}

export function NotesBoard({ session, onSignOut }: Props) {
  const { token } = session;
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchNotes(token)
      .then((data) => active && setNotes(data))
      .catch(() => active && setError('Impossible de charger les notes.'));
    return () => {
      active = false;
    };
  }, [token]);

  async function addNote(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    const note = await createNote(token, text);
    setNotes((prev) => [note, ...prev]);
  }

  async function remove(id: string) {
    await deleteNote(token, id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <main className="card" aria-labelledby="board-title">
      <header className="board-header">
        <h1 id="board-title">Mes notes</h1>
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

      <form className="new-task" onSubmit={addNote}>
        <label className="sr-only" htmlFor="new-note">
          Nouvelle note
        </label>
        <input
          id="new-note"
          data-testid="new-note-input"
          placeholder="Écrire une note…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" data-testid="add-note-button">
          Ajouter
        </button>
      </form>

      {notes.length === 0 ? (
        <p className="muted" data-testid="empty-state">
          Aucune note. ✍️
        </p>
      ) : (
        <ul className="task-list">
          {notes.map((note) => (
            <li key={note.id} className="task-item" data-testid="note-item">
              <span data-testid="note-text">{note.text}</span>
              <button
                type="button"
                className="link danger"
                data-testid="note-delete"
                aria-label={`Supprimer ${note.text}`}
                onClick={() => remove(note.id)}
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}

      <footer className="board-footer">
        <span data-testid="note-count">
          {notes.length} note{notes.length > 1 ? 's' : ''}
        </span>
      </footer>
    </main>
  );
}

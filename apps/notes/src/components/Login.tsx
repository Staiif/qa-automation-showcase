import { useState, type FormEvent } from 'react';
import { signIn, AuthError } from '../lib/auth';
import type { Session } from '../types';

interface Props {
  onSignedIn: (session: Session) => void;
}

export function Login({ onSignedIn }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      onSignedIn(await signIn(email, password));
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Erreur inattendue.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="card" aria-labelledby="login-title">
      <h1 id="login-title">Notely</h1>
      <p className="muted">Connectez-vous pour gérer vos notes.</p>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          data-testid="login-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label htmlFor="password">Mot de passe</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          data-testid="login-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="error" role="alert" data-testid="login-error">
            {error}
          </p>
        )}

        <button type="submit" data-testid="login-submit" disabled={loading}>
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      {import.meta.env.VITE_DEMO_EMAIL && (
        <p className="hint">
          Démo : <code>{import.meta.env.VITE_DEMO_EMAIL}</code> /{' '}
          <code>{import.meta.env.VITE_DEMO_PASSWORD}</code>
        </p>
      )}
    </main>
  );
}

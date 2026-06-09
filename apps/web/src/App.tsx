import { useState } from 'react';
import { Login } from './components/Login';
import { TaskBoard } from './components/TaskBoard';
import { getSession, signOut } from './lib/auth';
import type { Session } from './types';

export function App() {
  const [session, setSession] = useState<Session | null>(() => getSession());

  function handleSignOut() {
    signOut();
    setSession(null);
  }

  return (
    <div className="app">
      {session ? (
        <TaskBoard session={session} onSignOut={handleSignOut} />
      ) : (
        <Login onSignedIn={setSession} />
      )}
    </div>
  );
}

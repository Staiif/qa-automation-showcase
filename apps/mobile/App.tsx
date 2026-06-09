import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { LoginScreen } from './src/LoginScreen';
import { TaskBoardScreen } from './src/TaskBoardScreen';
import type { Session } from './src/auth';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />
      {session ? (
        <TaskBoardScreen session={session} onSignOut={() => setSession(null)} />
      ) : (
        <LoginScreen onSignedIn={setSession} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
});

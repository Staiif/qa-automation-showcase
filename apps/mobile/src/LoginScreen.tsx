import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AuthError, signIn, type Session } from './auth';

interface Props {
  onSignedIn: (session: Session) => void;
}

export function LoginScreen({ onSignedIn }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
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
    <View style={styles.container}>
      <Text style={styles.title} testID="login-title">
        Taskly
      </Text>
      <Text style={styles.subtitle}>Connectez-vous pour gérer vos tâches.</Text>

      <TextInput
        testID="login-email"
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#94a3b8"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        testID="login-password"
        style={styles.input}
        placeholder="Mot de passe"
        placeholderTextColor="#94a3b8"
        secureTextEntry
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
        value={password}
        onChangeText={setPassword}
      />

      {error && (
        <Text testID="login-error" style={styles.error}>
          {error}
        </Text>
      )}

      <TouchableOpacity
        testID="login-submit"
        style={styles.button}
        onPress={handleSubmit}
        disabled={loading}
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Se connecter</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0f172a' },
  title: { fontSize: 32, fontWeight: '700', color: '#e2e8f0' },
  subtitle: { color: '#94a3b8', marginBottom: 24 },
  input: {
    backgroundColor: '#0b1220',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    color: '#e2e8f0',
    marginBottom: 12,
  },
  error: { color: '#f87171', marginBottom: 12 },
  button: { backgroundColor: '#4f46e5', borderRadius: 10, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});

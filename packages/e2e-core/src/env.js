/** Read a required environment variable, or throw a clear, actionable message. */
export function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variable d'environnement manquante : ${name}. Lancez : cp .env.example .env`,
    );
  }
  return value;
}

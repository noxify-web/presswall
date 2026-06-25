export function getTursoConfig() {
  const url = process.env.TURSO_DATABASE_URL ?? "file:data/dev.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;

  return {
    url,
    authToken: authToken || undefined,
  };
}

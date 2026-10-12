export function getDatabaseUrl() {
  const connectionString = process.env.DATABASE_URL?.trim();

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured. Add the Supabase transaction-pooler URL to .env.local.");
  }

  return connectionString;
}

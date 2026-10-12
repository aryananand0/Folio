import { config as loadEnv } from "dotenv";

loadEnv({ path: [".env.local", ".env"], quiet: true });

const required = [
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
] as const;

const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) {
  throw new Error(`Missing deployment variables: ${missing.join(", ")}`);
}

function databaseUrl(name: "DATABASE_URL" | "DIRECT_URL") {
  const value = process.env[name] as string;
  if (/(?:YOUR_|PROJECT_REF|POOLER_HOST|PASSWORD|\.\.\.)/i.test(value)) {
    throw new Error(`${name} still contains a placeholder.`);
  }
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} is not a valid URL.`);
  }
  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    throw new Error(`${name} must be a PostgreSQL URL.`);
  }
  return parsed;
}

const pooled = databaseUrl("DATABASE_URL");
const migration = databaseUrl("DIRECT_URL");
if (pooled.port !== "6543") {
  throw new Error("DATABASE_URL must use the Supabase transaction pooler on port 6543 for Vercel.");
}
if (migration.port !== "5432") {
  throw new Error("DIRECT_URL must use the Supabase session pooler or direct connection on port 5432.");
}

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY as string;
const secretKey = process.env.CLERK_SECRET_KEY as string;
const clerkMode = publishableKey.startsWith("pk_live_") && secretKey.startsWith("sk_live_")
  ? "production"
  : publishableKey.startsWith("pk_test_") && secretKey.startsWith("sk_test_")
    ? "development"
    : null;
if (!clerkMode) {
  throw new Error("Clerk keys must be a matching pk_test_/sk_test_ or pk_live_/sk_live_ pair.");
}

const contact = process.env.OPEN_LIBRARY_CONTACT_EMAIL?.trim();
if (contact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
  throw new Error("OPEN_LIBRARY_CONTACT_EMAIL is not a valid email address.");
}

console.log("Required Vercel environment variables are present and structurally valid.");
console.log(`Clerk key pair: ${clerkMode} instance.`);
console.log(`Open Library contact: ${contact ? "configured" : "optional value not configured"}.`);

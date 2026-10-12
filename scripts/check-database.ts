import { config as loadEnv } from "dotenv";

loadEnv({ path: [".env.local", ".env"], quiet: true });

const { prisma } = await import("../src/lib/prisma.ts");

try {
  const result = await prisma.$queryRaw<Array<{ database: string; schema: string }>>`
    SELECT current_database() AS database, current_schema() AS schema
  `;
  const savedBookCount = await prisma.savedBook.count();
  const tableSecurity = await prisma.$queryRaw<Array<{ rlsEnabled: boolean }>>`
    SELECT c.relrowsecurity AS "rlsEnabled"
    FROM pg_class AS c
    JOIN pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname = current_schema() AND c.relname = 'SavedBook'
  `;
  const connection = result[0];
  const security = tableSecurity[0];

  console.log(`Connected to PostgreSQL database "${connection.database}" in schema "${connection.schema}".`);
  console.log(`SavedBook is queryable (${savedBookCount} rows).`);
  console.log(`SavedBook row-level security is ${security?.rlsEnabled ? "enabled" : "disabled"}.`);
} finally {
  await prisma.$disconnect();
}

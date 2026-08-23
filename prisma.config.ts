import "dotenv/config";
import { defineConfig } from "prisma/config";

// Schema commands (migrate, db push, studio) need the direct connection —
// Neon's pooled/pgbouncer endpoint doesn't support the session features
// Prisma Migrate relies on. DATABASE_URL (pooled) is what the app's
// generated Prisma Client uses at runtime; DIRECT_URL is CLI-only.
const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: databaseUrl || "postgresql://missing-database-url",
  },
});

if (!databaseUrl) {
  throw new Error(
    "DIRECT_URL (or DATABASE_URL) is required for Prisma schema commands. Set it in the environment or add it to a local .env file."
  );
}

import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl = process.env.DATABASE_URL;

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
    "DATABASE_URL is required for Prisma schema commands. Set it in the environment or add it to a local .env file."
  );
}

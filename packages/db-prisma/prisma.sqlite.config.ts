import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "prisma/config";

// There is deliberately no default-named prisma.config.ts in this package. A
// bare `prisma migrate` picking a provider implicitly is a footgun once two of
// them exist, so every command names the config it means.

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, "../..");
const envPath = path.join(repoRoot, ".env");

dotenv.config({ path: envPath });

export default defineConfig({
  schema: "prisma/sqlite/schema.prisma",
  migrations: {
    path: "prisma/sqlite/migrations",
  },
  datasource: {
    url:
      process.env["DATABASE_URL"] ??
      `file:${path.join(repoRoot, "lcase-db/sqlite/dev.db")}`,
  },
});

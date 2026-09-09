import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "prisma/config";

// prisma/postgres/schema.prisma is derived from the SQLite schema by
// scripts/build-schemas.mjs and is not checked in, so `pnpm run schema` has to
// have run before any command using this config. The package scripts chain it.

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, "../..");
const envPath = path.join(repoRoot, ".env");

dotenv.config({ path: envPath });

export default defineConfig({
  schema: "prisma/postgres/schema.prisma",
  migrations: {
    path: "prisma/postgres/migrations",
  },
  datasource: {
    // defaults to the docker-compose service, mirroring how the SQLite config
    // defaults to a file under lcase-db/
    url:
      process.env["POSTGRES_DATABASE_URL"] ??
      "postgresql://lcase:lcase@localhost:5433/lcase",
  },
});

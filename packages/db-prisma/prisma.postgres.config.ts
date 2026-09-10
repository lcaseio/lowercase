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

// The compose service publishes 5432 by default, and `POSTGRES_HOST_PORT` is
// the single knob that moves it. Deriving the default URLs from that same
// variable rather than hardcoding a port is what keeps the CLI, the compose
// binding, and the test suites in agreement when someone has to move it --
// a machine already running native Postgres, most likely.
const host = `localhost:${process.env["POSTGRES_HOST_PORT"] ?? "5432"}`;

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
      `postgresql://lcase:lcase@${host}/lcase`,
    // Required by `migrate diff --from-migrations`, which is how `check:migrations`
    // verifies the committed history still produces the current models. Prisma
    // creates and drops this database itself, so it must not name a real one.
    // SQLite needs no equivalent -- it is the only provider that can diff a
    // migrations directory offline.
    shadowDatabaseUrl:
      process.env["POSTGRES_SHADOW_DATABASE_URL"] ??
      `postgresql://lcase:lcase@${host}/lcase_shadow`,
  },
});

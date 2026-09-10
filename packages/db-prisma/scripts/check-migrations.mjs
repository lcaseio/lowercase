// Verifies that each provider's committed migration history still produces the
// models in its schema. Change C16 could only do this for SQLite, which is the
// one provider Prisma can diff a migrations directory for offline; Postgres
// needs a shadow database, so this check needs a running server.
//
// Run it with `pnpm -F @lcase/db-prisma run check:migrations`, and note the
// Postgres half is skipped rather than failed when no server is configured, so
// the same command is usable on a machine with nothing running.
import { spawn } from "node:child_process";

const POSTGRES_SHADOW_DB = "lcase_shadow";

function run(args, { input } = {}) {
  return new Promise((resolve) => {
    const child = spawn("prisma", args, {
      stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
      shell: false,
    });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    if (input !== undefined) child.stdin.end(input);
    child.on("close", (code) => resolve({ code, out }));
  });
}

async function diff(config, migrations, schema) {
  return run([
    "migrate",
    "diff",
    "--config",
    config,
    "--from-migrations",
    migrations,
    "--to-schema",
    schema,
    "--exit-code",
  ]);
}

const failures = [];

// SQLite runs offline.
{
  const { code, out } = await diff(
    "prisma.sqlite.config.ts",
    "prisma/sqlite/migrations",
    "prisma/sqlite/schema.prisma",
  );
  if (code === 0) console.log("sqlite: history matches schema");
  else failures.push(`sqlite:\n${out}`);
}

// Postgres needs a shadow database that already exists -- unlike `migrate dev`,
// `migrate diff` will not create one. Creating it is allowed to fail, which is
// what makes the check re-runnable: the second run finds it already there.
if (process.env.POSTGRES_TEST_URL || process.env.POSTGRES_DATABASE_URL) {
  await run(
    ["db", "execute", "--config", "prisma.postgres.config.ts", "--stdin"],
    { input: `CREATE DATABASE ${POSTGRES_SHADOW_DB}` },
  );

  const { code, out } = await diff(
    "prisma.postgres.config.ts",
    "prisma/postgres/migrations",
    "prisma/postgres/schema.prisma",
  );
  if (code === 0) console.log("postgres: history matches schema");
  else failures.push(`postgres:\n${out}`);
} else {
  console.log("postgres: skipped, no server configured");
}

if (failures.length > 0) {
  console.error(
    `\nMigration history does not match the schema.\nRegenerate the affected provider's migration rather than editing the schema alone.\n\n${failures.join("\n")}`,
  );
  process.exit(1);
}

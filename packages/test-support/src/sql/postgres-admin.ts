import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@lcase/db-prisma/postgres";

export const POSTGRES_TEMPLATE_DB = "lcase_test_template";
export const WORKER_DB_PREFIX = "lcase_test_w";

/**
 * Set by global setup once it has actually reached the server, and read by the
 * workers to decide whether the Postgres half of each suite runs. Availability
 * is probed rather than declared: an unset variable used to mean "skip", which
 * silently skipped Postgres on a machine where it was running perfectly well.
 */
export const POSTGRES_READY_ENV = "LCASE_POSTGRES_READY";

/**
 * The Postgres server the suites run against.
 *
 * Defaults to the docker-compose service, the same way
 * `prisma.postgres.config.ts` does, so nothing has to be set for the normal
 * case. `POSTGRES_TEST_URL` is purely an override, for a different host or port
 * -- and it is what CI sets, since a runner maps 5432 rather than 5434. It has
 * to stay listed in `turbo.json`'s `test:integration` `env` array or Turborepo
 * strips it and the override silently does nothing.
 *
 * Deliberately not `POSTGRES_DATABASE_URL`: that one names the developer's own
 * database, and these suites create and drop databases beside the one named
 * here.
 */
export function postgresTestUrl(): string {
  return (
    process.env["POSTGRES_TEST_URL"] ??
    "postgresql://lcase:lcase@localhost:5434/lcase"
  );
}

/**
 * `CREATE DATABASE` cannot run inside the database being created, so
 * administrative statements connect to the server's default database instead.
 */
export function maintenanceUrl(url: string): string {
  const maintenance = new URL(url);
  maintenance.pathname = "/postgres";
  return maintenance.toString();
}

export function workerDatabaseUrl(url: string, database: string): string {
  const target = new URL(url);
  target.pathname = `/${database}`;
  return target.toString();
}

export function postgresClient(connectionString: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

/** Opens a client, runs `body`, and always disconnects. */
export async function withPostgresDatabase<T>(
  connectionString: string,
  body: (client: PrismaClient) => Promise<T>,
): Promise<T> {
  const client = postgresClient(connectionString);
  try {
    return await body(client);
  } finally {
    await client.$disconnect();
  }
}

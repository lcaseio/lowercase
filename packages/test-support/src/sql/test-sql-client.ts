import type { SqlClient } from "@lcase/db-prisma";

/**
 * The client a suite gets from `createSqliteTestDb`/`createPostgresTestDb`.
 *
 * Narrowed the same way the repository seams in `packages/adapters` are, and for
 * the same reason: a whole generated delegate is not portable across providers.
 * It is typed against the SQLite client because that is the narrower of the two,
 * which is what makes the Postgres client satisfy it. See
 * `docs/initiatives/swappable-infrastructure/research/prisma-provider-type-seam-spike.md`.
 *
 * `Pick` of method names rather than `Omit` of the two known-unportable ones
 * (`aggregate`, `groupBy`), which reads like it would state the rule better but
 * does not compile. A delegate also carries a `types.operations` metadata
 * property describing every argument shape, and those sit in covariant positions
 * that recurse into provider-specific `WhereInput` types -- so contravariance
 * does not rescue them. `Omit` keeps that property; picking method names drops
 * it. Every method below is in the spike's verified-portable set.
 */
type PortableDelegate<T> = Pick<
  T,
  Extract<
    | "count"
    | "create"
    | "createMany"
    | "delete"
    | "deleteMany"
    | "findFirst"
    | "findMany"
    | "findUnique"
    | "update"
    | "upsert",
    keyof T
  >
>;

type ModelName =
  | "artifact"
  | "artifactParamCuration"
  | "evalResult"
  | "flow"
  | "flowVersion"
  | "run"
  | "runParam"
  | "runStepExport"
  | "runStepProjection"
  | "sim";

export type TestSqlClient = {
  [M in ModelName]: PortableDelegate<SqlClient[M]>;
} & {
  $disconnect(): Promise<void>;
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>;
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
};

/**
 * A live test database. `reset` empties every table without dropping the
 * schema, so the client stays valid across tests; `dispose` closes the
 * connection and releases whatever the provider allocated for this suite.
 */
export type TestDb = {
  client: TestSqlClient;
  reset(): Promise<void>;
  dispose(): Promise<void>;
};

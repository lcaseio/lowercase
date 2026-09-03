// Single-variant placeholder -- SQLite (via the global Prisma client) is the
// only real backend today. the related change adds a "postgres" branch.
export type SqlConfig = { kind: "sqlite" };

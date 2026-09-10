// No client instance here any more. A module-global constructed at import time
// is what kept the runtime from choosing its provider by config at all -- see
// swappable-infrastructure Change C18. Construction moved to
// packages/runtime's buildSqlClient; only the default location stayed behind,
// because the Prisma CLI and a running app have to agree on it.
export { defaultSqliteUrl } from "./sqlite-url.js";

// exported for type definitions
export * from "./generated/sqlite/client.js";
export * from "./generated/sqlite/commonInputTypes.js";
export * from "./generated/sqlite/enums.js";
export * from "./generated/sqlite/models.js";

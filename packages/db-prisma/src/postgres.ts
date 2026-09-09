// No singleton here, unlike ./sqlite.ts: nothing constructs a Postgres client
// yet. Wiring provider selection into the runtime is a later Change; this
// subpath exists so the generated client's types can be referenced, which is
// what the cross-provider seam assertion in @lcase/adapters needs.

// exported for type definitions
export * from "./generated/postgres/client.js";
export * from "./generated/postgres/commonInputTypes.js";
export * from "./generated/postgres/enums.js";
export * from "./generated/postgres/models.js";

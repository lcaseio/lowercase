// Single-variant for now: Messages are routed in-process, by mailboxes this
// process owns. Named for the mechanism, matching the other config axes
// (`artifacts: { kind: "filesystem" }`, `sql: { kind: "sqlite" }`), so a
// log-backed `"redis-streams"` branch sits beside it on the same axis rather
// than describing a different one.
export type MessagingConfig = { kind: "in-process" };

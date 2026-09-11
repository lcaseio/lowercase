/**
 * The `local-system` process profile: the complete embedded object graph, its
 * supported concrete providers, and the assembler that orders their lifecycle.
 *
 * This is one profile whose process happens to host almost the whole system,
 * not the definition of a runtime. It is a shared package rather than app-local
 * because two executables build this same graph -- the HTTP server and the CLI.
 * See ADR-0008.
 *
 * The HTTP-job protocol declarations live here for now because this profile is
 * still their only honest owner. A second process host is what supplies the
 * evidence to promote them into a shared protocol catalog.
 */
export * from "./config/index.js";
export * from "./assemble-embedded-system.js";
export * from "./http-job.topology.js";
export * from "./local-system.profile.js";
export * from "./build-artifact-store.js";

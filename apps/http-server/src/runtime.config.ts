import type { RuntimeConfig } from "@lcase/runtime";
import path from "node:path";

export const config = {
  bus: {
    id: "",
    placement: "embedded",
    transport: "event-emitter",
    store: "none",
  },
  queue: {
    id: "",
    placement: "embedded",
    transport: "deferred-promise",
    store: "none",
  },
  router: {
    id: "",
  },
  engine: {
    id: "",
  },
  worker: {
    id: "default-worker",
    maxConcurrentJobs: 4,
    protocolTimeoutMs: 60_000,
    maxConcurrencyPerKey: 2,
  },
  stream: {
    id: "",
  },
  observability: {
    id: "",
    sinks: ["console-log-sink", "replay-jsonl-sink"],
  },
  limiter: {
    id: "cli-limiter",
    placement: "embedded",
    scope: "cli-global",
    store: "none",
    transport: "event-emitter",
  },
  artifacts: {
    path: path.resolve(process.cwd(), "lcase-db/artifacts"),
  },
} satisfies RuntimeConfig;

/**
 * api client
 * client api
 * server api
 */

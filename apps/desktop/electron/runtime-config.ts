import type { RuntimeConfig } from "@lcase/runtime";
import path from "node:path";

export const runtimeConfig = {
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
    id: "desktop-worker",
  },
  stream: {
    id: "",
  },
  observability: {
    id: "",
    sinks: ["console-log-sink", "replay-jsonl-sink"],
  },
  limiter: {
    id: "electron-limiter",
    placement: "embedded",
    scope: "electron-global",
    store: "none",
    transport: "event-emitter",
  },
  artifacts: {
    path: path.resolve(process.cwd(), "run-artifacts"),
    placement: "embedded",
    transport: "local",
    store: "fs",
  },
} satisfies RuntimeConfig;

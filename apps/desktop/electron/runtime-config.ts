import type { RuntimeConfig } from "@lcase/runtime";

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
} satisfies RuntimeConfig;

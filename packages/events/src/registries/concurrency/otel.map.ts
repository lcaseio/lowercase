import type { ConcurrencyOtelAttributesMap } from "@lcase/types";

export const concurrencyOtelAttributesMap: ConcurrencyOtelAttributesMap = {
  "concurrency.tool.denied": {
    action: "denied",
    domain: "concurrency",
    entity: "tool",
  },
  "concurrency.tool.granted": {
    action: "granted",
    domain: "concurrency",
    entity: "tool",
  },
  "concurrency.started": {
    action: "started",
    domain: "concurrency",
    entity: undefined,
  },
  "concurrency.stopped": {
    action: "stopped",
    domain: "concurrency",
    entity: undefined,
  },
};

import type { ThrottlerOtelAttributesMap } from "@lcase/types";

export const throttlerOtelAttributesMap: ThrottlerOtelAttributesMap = {
  "throttler.tool.denied": {
    action: "denied",
    domain: "throttler",
    entity: "tool",
  },
  "throttler.tool.granted": {
    action: "granted",
    domain: "throttler",
    entity: "tool",
  },
  "throttler.started": {
    action: "started",
    domain: "throttler",
    entity: undefined,
  },
  "throttler.stopped": {
    action: "stopped",
    domain: "throttler",
    entity: undefined,
  },
};

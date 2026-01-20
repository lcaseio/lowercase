import type { LimiterOtelAttributesMap } from "@lcase/types";

export const limiterOtelAttributesMap: LimiterOtelAttributesMap = {
  "limiter.slot.denied": {
    action: "denied",
    domain: "limiter",
    entity: "slot",
  },
  "limiter.slot.granted": {
    action: "granted",
    domain: "limiter",
    entity: "slot",
  },
  "limiter.started": {
    action: "started",
    domain: "limiter",
    entity: undefined,
  },
  "limiter.stopped": {
    action: "stopped",
    domain: "limiter",
    entity: undefined,
  },
};

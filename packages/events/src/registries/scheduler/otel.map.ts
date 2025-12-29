import { SchedulerOtelAttributesMap } from "@lcase/types";

export const schedulerOtelAttributesMap: SchedulerOtelAttributesMap = {
  "scheduler.tool.requested": {
    action: "requested",
    domain: "scheduler",
    entity: "tool",
  },
  "scheduler.started": {
    action: "started",
    domain: "scheduler",
    entity: undefined,
  },
  "scheduler.stopped": {
    action: "stopped",
    domain: "scheduler",
    entity: undefined,
  },
};

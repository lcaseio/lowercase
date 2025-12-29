import type { SchedulerEventType } from "@lcase/types";

export const schedulerEventTypes = [
  "scheduler.started",
  "scheduler.stopped",
  "scheduler.tool.requested",
] as const satisfies SchedulerEventType[];

type MissingSchedulerTypes = Exclude<
  SchedulerEventType,
  (typeof schedulerEventTypes)[number]
>;
type _ListsAllSchedulerTypes = MissingSchedulerTypes extends never
  ? true
  : never;
const _checkEventTypes: _ListsAllSchedulerTypes = true;

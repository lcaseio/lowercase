import type {
  DomainActionDescriptor,
  DomainEntityActionDescriptor,
} from "../shared/otel-attributes.js";
import type {
  SchedulerStartedData,
  SchedulerStoppedData,
  SchedulerToolRequestedData,
} from "./data.js";

type Scheduler = "scheduler";
export type SchedulerEventMap = {
  "scheduler.tool.requested": DomainEntityActionDescriptor<
    Scheduler,
    "tool",
    "requested",
    SchedulerToolRequestedData
  >;
  "scheduler.started": DomainActionDescriptor<
    Scheduler,
    "started",
    SchedulerStartedData
  >;
  "scheduler.stopped": DomainActionDescriptor<
    Scheduler,
    "stopped",
    SchedulerStoppedData
  >;
};

export type SchedulerEventType = keyof SchedulerEventMap;
export type SchedulerEventData<T extends SchedulerEventType> =
  SchedulerEventMap[T]["data"];
export type SchedulerOtelAttributesMap = {
  [T in SchedulerEventType]: Omit<SchedulerEventMap[T], "data">;
};

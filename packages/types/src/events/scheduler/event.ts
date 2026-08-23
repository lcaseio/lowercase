import type { CloudEvent } from "../shared/cloud-event.js";
import type { SchedulerEventType } from "./map.js";

export type SchedulerScope = {
  schedulerid: string;
};

export type SchedulerEvent<T extends SchedulerEventType = SchedulerEventType> =
  CloudEvent<T> & SchedulerScope;

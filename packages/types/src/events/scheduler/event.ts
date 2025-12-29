import { CloudEvent } from "../shared/cloud-event.js";
import { SchedulerEventType } from "./map.js";

export type SchedulerScope = {
  schedulerid: string;
};

export type SchedulerEvent<T extends SchedulerEventType = SchedulerEventType> =
  CloudEvent<T> & SchedulerScope;

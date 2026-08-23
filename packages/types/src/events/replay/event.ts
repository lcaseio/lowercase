import type { CloudEvent } from "../shared/cloud-event.js";
import type { ReplayEventType } from "./map.js";

export type ReplayScope = {
  runid: string;
};

export type ReplayEvent<T extends ReplayEventType> = CloudEvent<T> &
  ReplayScope;

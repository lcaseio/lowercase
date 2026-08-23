import type { JobScope } from "../job/event.js";
import type { CloudEvent } from "../shared/cloud-event.js";
import type { ToolEventType } from "./map.js";

export type ToolScope = JobScope & {
  toolid: string;
};

export type ToolEvent<T extends ToolEventType> = CloudEvent<T> & ToolScope;

import type { CloudEvent } from "../shared/cloud-event.js";
import type { FlowEventType } from "./map.js";

export type FlowScope = {
  flowid: string;
  flowversionid: string;
  runid: string;
};

export type FlowEvent<T extends FlowEventType> = CloudEvent<T> & FlowScope;

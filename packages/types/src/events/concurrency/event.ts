import { CloudEvent } from "../shared/cloud-event.js";
import { ConcurrencyEventType } from "./map.js";

export type ConcurrencyScope = {
  concurrencyid: string;
};

export type ConcurrencyEvent<
  T extends ConcurrencyEventType = ConcurrencyEventType
> = CloudEvent<T> & ConcurrencyScope;

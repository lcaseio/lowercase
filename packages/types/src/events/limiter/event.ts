import { CloudEvent } from "../shared/cloud-event.js";
import { LimiterEventType } from "./map.js";

export type LimiterScope = {
  limiterid: string;
};

export type LimiterEvent<T extends LimiterEventType = LimiterEventType> =
  CloudEvent<T> & LimiterScope;

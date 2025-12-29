import { CloudEvent } from "../shared/cloud-event.js";
import { ThrottlerEventType } from "./map.js";

export type ThrottlerScope = {
  throttlerid: string;
};

export type ThrottlerEvent<T extends ThrottlerEventType = ThrottlerEventType> =
  CloudEvent<T> & ThrottlerScope;

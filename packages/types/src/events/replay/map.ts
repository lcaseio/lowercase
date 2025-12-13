import { JobEventMap } from "../job/map.js";
import { DomainEntityActionDescriptor } from "../shared/otel-attributes.js";
import { ReplayModeSubmittedData } from "./data.js";

export type ReplayEventMap = {
  "replay.mode.submitted": DomainEntityActionDescriptor<
    "replay",
    "mode",
    "submitted",
    ReplayModeSubmittedData
  >;
};

export type ReplayEventType = keyof ReplayEventMap;
export type ReplayEventData<T extends ReplayEventType> =
  ReplayEventMap[T]["data"];
export type ReplayOtelAttributesMap = {
  [T in ReplayEventType]: Omit<ReplayEventMap[T], "data">;
};

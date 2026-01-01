import type {
  DomainActionDescriptor,
  DomainEntityActionDescriptor,
} from "../shared/otel-attributes.js";
import type {
  LimiterStartedData,
  LimiterStoppedData,
  LimiterSlotDeniedData,
  LimiterSlotGrantedData,
} from "./data.js";

type Limiter = "limiter";
type Slot = "slot";
export type LimiterEventMap = {
  "limiter.slot.granted": DomainEntityActionDescriptor<
    Limiter,
    Slot,
    "granted",
    LimiterSlotGrantedData
  >;
  "limiter.slot.denied": DomainEntityActionDescriptor<
    Limiter,
    Slot,
    "denied",
    LimiterSlotDeniedData
  >;
  "limiter.started": DomainActionDescriptor<
    Limiter,
    "started",
    LimiterStartedData
  >;
  "limiter.stopped": DomainActionDescriptor<
    Limiter,
    "stopped",
    LimiterStoppedData
  >;
};

export type LimiterEventType = keyof LimiterEventMap;
export type LimiterEventData<T extends LimiterEventType> =
  LimiterEventMap[T]["data"];
export type LimiterOtelAttributesMap = {
  [T in LimiterEventType]: Omit<LimiterEventMap[T], "data">;
};

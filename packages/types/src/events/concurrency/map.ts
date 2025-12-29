import type {
  DomainActionDescriptor,
  DomainEntityActionDescriptor,
} from "../shared/otel-attributes.js";
import type {
  ConcurrencyStartedData,
  ConcurrencyStoppedData,
  ConcurrencyToolDeniedData,
  ConcurrencyToolGrantedData,
} from "./data.js";

type Concurrency = "concurrency";
type Tool = "tool";
export type ConcurrencyEventMap = {
  "concurrency.tool.granted": DomainEntityActionDescriptor<
    Concurrency,
    Tool,
    "granted",
    ConcurrencyToolGrantedData
  >;
  "concurrency.tool.denied": DomainEntityActionDescriptor<
    Concurrency,
    Tool,
    "denied",
    ConcurrencyToolDeniedData
  >;
  "concurrency.started": DomainActionDescriptor<
    Concurrency,
    "started",
    ConcurrencyStartedData
  >;
  "concurrency.stopped": DomainActionDescriptor<
    Concurrency,
    "stopped",
    ConcurrencyStoppedData
  >;
};

export type ConcurrencyEventType = keyof ConcurrencyEventMap;
export type ConcurrencyEventData<T extends ConcurrencyEventType> =
  ConcurrencyEventMap[T]["data"];
export type ConcurrencyOtelAttributesMap = {
  [T in ConcurrencyEventType]: Omit<ConcurrencyEventMap[T], "data">;
};

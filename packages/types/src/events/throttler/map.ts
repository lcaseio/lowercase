import type {
  DomainActionDescriptor,
  DomainEntityActionDescriptor,
} from "../shared/otel-attributes.js";
import type {
  ThrottlerStartedData,
  ThrottlerStoppedData,
  ThrottlerToolDeniedData,
  ThrottlerToolGrantedData,
} from "./data.js";

type Throttler = "throttler";
type Tool = "tool";
export type ThrottlerEventMap = {
  "throttler.tool.granted": DomainEntityActionDescriptor<
    Throttler,
    Tool,
    "granted",
    ThrottlerToolGrantedData
  >;
  "throttler.tool.denied": DomainEntityActionDescriptor<
    Throttler,
    Tool,
    "denied",
    ThrottlerToolDeniedData
  >;
  "throttler.started": DomainActionDescriptor<
    Throttler,
    "started",
    ThrottlerStartedData
  >;
  "throttler.stopped": DomainActionDescriptor<
    Throttler,
    "stopped",
    ThrottlerStoppedData
  >;
};

export type ThrottlerEventType = keyof ThrottlerEventMap;
export type THrottlerEventData<T extends ThrottlerEventType> =
  ThrottlerEventMap[T]["data"];
export type ThrottlerOtelAttributesMap = {
  [T in ThrottlerEventType]: Omit<ThrottlerEventMap[T], "data">;
};

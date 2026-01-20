import type { DomainActionDescriptor } from "../shared/otel-attributes.js";
import type {
  FlowQueuedData,
  FlowCompletedData,
  FlowStartedData,
  FlowFailedData,
  FlowSubmittedData,
  FlowAnalyzedData,
} from "./data.js";

export type FlowEventMap = {
  "flow.queued": DomainActionDescriptor<"flow", "queued", FlowQueuedData>;
  "flow.submitted": DomainActionDescriptor<
    "flow",
    "submitted",
    FlowSubmittedData
  >;
  "flow.analyzed": DomainActionDescriptor<"flow", "analyzed", FlowAnalyzedData>;
  "flow.started": DomainActionDescriptor<"flow", "started", FlowStartedData>;
  "flow.completed": DomainActionDescriptor<
    "flow",
    "completed",
    FlowCompletedData
  >;
  "flow.failed": DomainActionDescriptor<"flow", "failed", FlowFailedData>;
};

export type FlowEventType = keyof FlowEventMap;
export type FlowEventData<T extends FlowEventType> = FlowEventMap[T]["data"];
export type FlowOtelAttributesMap = {
  [T in FlowEventType]: Omit<FlowEventMap[T], "data">;
};

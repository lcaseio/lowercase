import type {
  RunCompletedData,
  RunDeniedData,
  RunFailedData,
  RunRequestedData,
  RunStartedData,
} from "./data.js";
import type { DomainActionDescriptor } from "../shared/otel-attributes.js";

export type RunEventMap = {
  "run.requested": DomainActionDescriptor<"run", "requested", RunRequestedData>;
  "run.denied": DomainActionDescriptor<"run", "denied", RunDeniedData>;
  "run.started": DomainActionDescriptor<"run", "started", RunStartedData>;
  "run.completed": DomainActionDescriptor<"run", "completed", RunCompletedData>;
  "run.failed": DomainActionDescriptor<"run", "failed", RunFailedData>;
};

export type RunEventType = keyof RunEventMap;
export type RunEventData<T extends RunEventType> = RunEventMap[T]["data"];
export type RunOtelAttributesMap = {
  [T in RunEventType]: Omit<RunEventMap[T], "data">;
};

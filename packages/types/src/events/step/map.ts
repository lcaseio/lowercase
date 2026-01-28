import type { DomainActionDescriptor } from "../shared/otel-attributes.js";
import {
  StepCompletedData,
  StepFailedData,
  StepPlannedData,
  StepReusedData,
  StepStartedData,
} from "./data.js";

export type StepEventMap = {
  "step.planned": DomainActionDescriptor<"step", "planned", StepPlannedData>;
  "step.started": DomainActionDescriptor<"step", "started", StepStartedData>;
  "step.completed": DomainActionDescriptor<
    "step",
    "completed",
    StepCompletedData
  >;
  "step.failed": DomainActionDescriptor<"step", "failed", StepFailedData>;
  "step.reused": DomainActionDescriptor<"step", "reused", StepReusedData>;
};

export type StepEventType = Extract<keyof StepEventMap, `step.${string}`>;
export type StepEventData<T extends StepEventType> = StepEventMap[T]["data"];
export type StepOtelAttributesMap = {
  [T in StepEventType]: Omit<StepEventMap[T], "data">;
};

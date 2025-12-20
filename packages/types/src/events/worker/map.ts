import {
  DomainActionDescriptor,
  DomainEntityActionDescriptor,
} from "../shared/otel-attributes.js";
import {
  WorkerProfileAddedData,
  WorkerProfileSubmittedData as WorkerProfileSubmittedData,
  WorkerStartedData,
  WorkerStoppedData,
} from "./data.js";

export type WorkerEventMap = {
  "worker.started": DomainActionDescriptor<
    "worker",
    "started",
    WorkerStartedData
  >;
  "worker.stopped": DomainActionDescriptor<
    "worker",
    "stopped",
    WorkerStoppedData
  >;
  "worker.profile.submitted": DomainEntityActionDescriptor<
    "worker",
    "profile",
    "submitted",
    WorkerProfileSubmittedData
  >;
  "worker.profile.added": DomainEntityActionDescriptor<
    "worker",
    "profile",
    "added",
    WorkerProfileAddedData
  >;
};

export type WorkerEventType = keyof WorkerEventMap;
export type WorkerEventData<T extends WorkerEventType> =
  WorkerEventMap[T]["data"];
export type WorkerOtelAttributesMap = {
  [T in WorkerEventType]: Omit<WorkerEventMap[T], "data">;
};

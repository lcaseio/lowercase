import { CapId } from "../../flow/map.js";
import type { DomainEntityActionDescriptor } from "../shared/otel-attributes.js";
import { JobMcpData } from "./data.js";
import { JobHttpJsonEventMap } from "./httpjson/map.js";

export type DomainCapActionDescriptor<
  Domain extends string,
  Id extends CapId,
  Action extends string,
  Data
> = {
  domain: Domain;
  entity: Id;
  action: Action;
  data: Data;
};

export type JobEventMap = JobHttpJsonEventMap & {
  "job.mcp.submitted": DomainCapActionDescriptor<
    "job",
    "mcp",
    "submitted",
    JobMcpData
  >;
  "job.mcp.queued": DomainEntityActionDescriptor<
    "job",
    "mcp",
    "queued",
    JobMcpData
  >;
};

export type JobEventType = keyof JobEventMap;

export type JobEventData<T extends JobEventType> = JobEventMap[T]["data"];
export type JobOtelAttributesMap = {
  [T in JobEventType]: Omit<JobEventMap[T], "data">;
};

export type JobSubmittedType = Extract<JobEventType, `${string}.submitted`>;
export type JobDelayedType = Extract<JobEventType, `${string}.delayed`>;
export type JobQueuedType = Extract<JobEventType, `${string}.queued`>;
export type JobCompletedType = Extract<JobEventType, `${string}.completed`>;
export type JobFailedType = Extract<JobEventType, `${string}.failed`>;

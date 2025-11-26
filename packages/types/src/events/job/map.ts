import { CapId } from "../../flow/map.js";
import type {
  DomainEntityActionDescriptor,
  DomainActionDescriptor,
} from "../shared/otel-attributes.js";
import {
  JobCompletedData,
  JobFailedData,
  JobHttpJsonData,
  JobStartedData,
  JobQueuedData,
  JobMcpData,
} from "./data.js";

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

export type JobEventMap = {
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
  "job.httpjson.submitted": DomainEntityActionDescriptor<
    "job",
    "httpjson",
    "submitted",
    JobHttpJsonData
  >;
  "job.httpjson.queued": DomainEntityActionDescriptor<
    "job",
    "httpjson",
    "queued",
    JobHttpJsonData
  >;
  "job.started": DomainActionDescriptor<"job", "started", JobStartedData>;
  "job.completed": DomainActionDescriptor<"job", "completed", JobCompletedData>;
  "job.failed": DomainActionDescriptor<"job", "failed", JobFailedData>;
};

export type JobEventType = keyof JobEventMap;

export type JobEventData<T extends JobEventType> = JobEventMap[T]["data"];
export type JobOtelAttributesMap = {
  [T in JobEventType]: Omit<JobEventMap[T], "data">;
};

export type JobQueuedType = Extract<JobEventType, `${string}.queued`>;

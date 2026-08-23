import type { DomainEntityActionDescriptor } from "../../shared/otel-attributes.js";
import type { JobCompletedData, JobFailedData } from "../data.js";
import type { DomainCapActionDescriptor } from "../map.js";
import type {
  JobMcpData,
  JobMcpQueuedData,
  JobMcpSubmittedData,
} from "./data.js";

export type JobMcpEventMap = {
  "job.mcp.submitted": DomainCapActionDescriptor<
    "job",
    "mcp",
    "submitted",
    JobMcpSubmittedData
  >;
  "job.mcp.queued": DomainEntityActionDescriptor<
    "job",
    "mcp",
    "queued",
    JobMcpQueuedData
  >;
  "job.mcp.delayed": DomainEntityActionDescriptor<
    "job",
    "mcp",
    "delayed",
    JobMcpData
  >;
  "job.mcp.resumed": DomainEntityActionDescriptor<
    "job",
    "mcp",
    "resumed",
    JobMcpData
  >;
  "job.mcp.started": DomainEntityActionDescriptor<
    "job",
    "mcp",
    "started",
    JobMcpData
  >;
  "job.mcp.completed": DomainEntityActionDescriptor<
    "job",
    "mcp",
    "completed",
    JobCompletedData
  >;
  "job.mcp.failed": DomainEntityActionDescriptor<
    "job",
    "mcp",
    "failed",
    JobFailedData
  >;
};

export type JobMcpEventType = keyof JobMcpEventMap;

import { DomainEntityActionDescriptor } from "../../shared/otel-attributes.js";
import { JobCompletedData, JobFailedData } from "../data.js";
import { DomainCapActionDescriptor } from "../map.js";
import { JobMcpData } from "./data.js";

export type JobMcpEventMap = {
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

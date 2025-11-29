import { z } from "zod";
import { AnyEvent } from "@lcase/types";
import { CloudEventContextSchema } from "../../cloud-context.schema.js";
import {
  JobCompletedDataSchema,
  JobFailedDataSchema,
  JobMcpDataSchema,
  JobMcpResolvedDataSchema,
} from "../job.data.schema.js";
import { JobScopeSchema } from "../job.event.schema.js";

export const JobMcpSubmittedSchema = CloudEventContextSchema.merge(
  JobScopeSchema
)
  .merge(
    z.object({
      type: z.literal("job.mcp.submitted"),
      entity: z.literal("mcp"),
      action: z.literal("submitted"),
      capid: z.literal("mcp"),
      data: JobMcpDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"job.mcp.submitted">>;

export const JobMcpDelayedSchema = CloudEventContextSchema.merge(JobScopeSchema)
  .merge(
    z.object({
      type: z.literal("job.mcp.delayed"),
      entity: z.literal("mcp"),
      action: z.literal("delayed"),
      capid: z.literal("mcp"),
      data: JobMcpResolvedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"job.mcp.delayed">>;

export const JobMcpQueuedSchema = CloudEventContextSchema.merge(JobScopeSchema)
  .merge(
    z.object({
      type: z.literal("job.mcp.queued"),
      entity: z.literal("mcp"),
      action: z.literal("queued"),
      capid: z.literal("mcp"),
      data: JobMcpResolvedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"job.mcp.queued">>;

export const JobMcpStartedSchema = CloudEventContextSchema.merge(JobScopeSchema)
  .merge(
    z.object({
      type: z.literal("job.mcp.started"),
      entity: z.literal("mcp"),
      action: z.literal("started"),
      capid: z.literal("mcp"),
      data: JobMcpResolvedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"job.mcp.started">>;

export const JobMcpCompletedSchema = CloudEventContextSchema.merge(
  JobScopeSchema
)
  .merge(
    z.object({
      type: z.literal("job.mcp.completed"),
      entity: z.literal("mcp"),
      action: z.literal("completed"),
      capid: z.literal("mcp"),
      data: JobCompletedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"job.mcp.completed">>;

export const JobMcpFailedSchema = CloudEventContextSchema.merge(JobScopeSchema)
  .merge(
    z.object({
      type: z.literal("job.mcp.failed"),
      entity: z.literal("mcp"),
      action: z.literal("failed"),
      capid: z.literal("mcp"),
      data: JobFailedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"job.mcp.failed">>;

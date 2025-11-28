import { z } from "zod";
import type { AnyEvent, JobScope } from "@lcase/types";
import { CloudEventContextSchema } from "../cloud-context.schema.js";
import { CapIdSchema, JobMcpQueuedDataSchema } from "./job.data.schema.js";

export const JobScopeSchema = z
  .object({
    flowid: z.string(),
    runid: z.string(),
    stepid: z.string(),
    jobid: z.string(),
    capid: CapIdSchema,
    toolid: z.string().nullable(),
    domain: z.literal("job"),
  })
  .strict() satisfies z.ZodType<JobScope>;

export const JobMcpQueuedSchema = CloudEventContextSchema.merge(JobScopeSchema)
  .merge(
    z.object({
      type: z.literal("job.mcp.queued"),
      entity: z.literal("mcp"),
      action: z.literal("queued"),
      capid: z.literal("mcp"),
      data: JobMcpQueuedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"job.mcp.queued">>;

export const JobMcpSchema = CloudEventContextSchema.merge(JobScopeSchema)
  .merge(
    z.object({
      type: z.literal("job.mcp.submitted"),
      entity: z.literal("mcp"),
      action: z.literal("submitted"),
      capid: z.literal("mcp"),
      data: JobMcpQueuedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"job.mcp.submitted">>;

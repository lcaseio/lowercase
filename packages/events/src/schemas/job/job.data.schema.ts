import { z } from "zod";
import type {
  JobCompletedData,
  JobDelayedData,
  JobDescriptor,
  JobFailedData,
  JobHttpJsonData,
  JobMcpQueuedData,
  JobStartedData,
  PipeData,
} from "@lcase/types";
import type { CapId } from "@lcase/types";

export const CapIdSchema = z.enum([
  "mcp",
  "httpjson",
]) satisfies z.ZodType<CapId>;
const JobDescriptorDataSchema = z
  .object({
    job: z.object({
      id: z.string(),
      toolid: z.string().nullable(),
      capid: CapIdSchema,
    }),
  })
  .strict() satisfies z.ZodType<JobDescriptor>;

const PipeDataSchema = z
  .object({
    to: z
      .object({
        id: z.string(),
        payload: z.string(),
      })
      .optional(),
    from: z
      .object({
        id: z.string(),
        buffer: z.number().optional(),
      })
      .optional(),
  })
  .strict() satisfies z.ZodType<PipeData>;

export const JobDelayedDataSchema = z.object({
  reason: z.string(),
}) satisfies z.ZodType<JobDelayedData>;

export const JobMcpQueuedDataSchema = JobDescriptorDataSchema.merge(
  z.object({
    url: z.string(),
    transport: z.enum(["sse", "stdio", "streamable-http", "http"]),
    feature: z.object({
      primitive: z.enum([
        "resource",
        "prompt",
        "tool",
        "sampling",
        "roots",
        "elicitation",
      ]),
      name: z.string(),
    }),
    args: z.record(z.string(), z.unknown()).optional(),
    pipe: PipeDataSchema,
  })
).strict() satisfies z.ZodType<JobMcpQueuedData>;

export const JobHttpJsonDataSchema = JobDescriptorDataSchema.merge(
  z.object({
    url: z.string(),
    method: z
      .enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"])
      .optional(),

    headers: z.record(z.string(), z.unknown()).optional(),
    body: z.record(z.string(), z.unknown()).optional(),
    pipe: PipeDataSchema,
  })
).strict() satisfies z.ZodType<JobHttpJsonData>;

export const JobStartedDataSchema = JobDescriptorDataSchema.merge(
  z.object({
    status: z.literal("started"),
  })
).strict() satisfies z.ZodType<JobStartedData>;

export const JobCompletedDataSchema = JobDescriptorDataSchema.merge(
  z.object({
    status: z.literal("completed"),
    result: z.unknown(),
  })
).strict() satisfies z.ZodType<JobCompletedData>;

export const JobFailedDataSchema = JobDescriptorDataSchema.merge(
  z.object({
    status: z.literal("failed"),
    result: z.unknown(),
    reason: z.string(),
  })
).strict() satisfies z.ZodType<JobFailedData>;

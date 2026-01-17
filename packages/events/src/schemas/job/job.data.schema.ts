import { z } from "zod";
import type {
  JobCompletedData,
  JobDelayedData,
  JobDescriptor,
  JobFailedData,
  JobHttpJsonData,
  JobStartedData,
  PipeData,
  CapId,
  JobMcpData,
} from "@lcase/types";

export const CapIdSchema = z.enum([
  "mcp",
  "httpjson",
]) satisfies z.ZodType<CapId>;
const JobDescriptorDataSchema = z
  .object({
    job: z.object({
      id: z.string(),
      toolid: z.string(),
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

/* Mcp */

export const JobMcpDataSchema = z
  .object({
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
  })
  .strict() satisfies z.ZodType<JobMcpData>;

/* HttpJson */

export const JobHttpJsonDataSchema = z
  .object({
    url: z.string(),
    method: z
      .enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"])
      .optional(),
    headers: z.record(z.string(), z.string()).optional(),
    body: z.record(z.string(), z.unknown()).optional(),
    args: z.record(z.string(), z.unknown()).optional(),
  })
  .strict() satisfies z.ZodType<Omit<JobHttpJsonData, "type">>;

export const JobDelayedDataSchema = z.object({
  reason: z.string(),
}) satisfies z.ZodType<JobDelayedData>;

export const JobStartedDataSchema = z
  .object({
    status: z.literal("started"),
  })
  .strict() satisfies z.ZodType<JobStartedData>;

export const JobCompletedDataSchema = z
  .object({
    status: z.literal("success"),
    output: z.string().nullable(),
    message: z.string().optional(),
  })
  .strict() satisfies z.ZodType<JobCompletedData>;

export const JobFailedDataSchema = z
  .object({
    status: z.literal("failure"),
    output: z.string().nullable(),
    message: z.string().optional(),
  })
  .strict() satisfies z.ZodType<JobFailedData>;

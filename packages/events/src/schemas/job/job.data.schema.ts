import { z } from "zod";
import type {
  JobCompletedData,
  JobDelayedData,
  JobDescriptor,
  JobDescriptorResolved,
  JobFailedData,
  JobHttpJsonData,
  JobStartedData,
  PipeData,
  CapId,
  JobMcpResolvedData,
  JobMcpData,
  JobHttpJsonResolvedData,
} from "@lcase/types";

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

const JobDescriptorResolvedDataSchema = z
  .object({
    job: z.object({
      id: z.string(),
      toolid: z.string(),
      capid: CapIdSchema,
    }),
  })
  .strict() satisfies z.ZodType<JobDescriptorResolved>;

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

/* Mcp */

export const JobMcpBaseDataSchema = z.object({
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
});
export const JobMcpDataSchema = z
  .object({
    ...JobMcpBaseDataSchema.shape,
    ...JobDescriptorDataSchema.shape,
  })
  .strict() satisfies z.ZodType<JobMcpData>;

export const JobMcpResolvedDataSchema = z
  .object({
    ...JobMcpBaseDataSchema.shape,
    ...JobDescriptorResolvedDataSchema.shape,
  })
  .strict() satisfies z.ZodType<JobMcpResolvedData>;

/* HttpJson */

export const JobHttpJsonBaseData = z.object({
  url: z.string(),
  method: z
    .enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"])
    .optional(),

  headers: z.record(z.string(), z.string()).optional(),
  body: z.record(z.string(), z.unknown()).optional(),
  pipe: PipeDataSchema,
});

export const JobHttpJsonDataSchema = JobDescriptorDataSchema.merge(
  JobHttpJsonBaseData
).strict() satisfies z.ZodType<JobHttpJsonData>;

export const JobHttpJsonResolvedDataSchema = z
  .object({
    ...JobHttpJsonBaseData.shape,
    ...JobDescriptorResolvedDataSchema.shape,
  })
  .strict() satisfies z.ZodType<JobHttpJsonResolvedData>;

export const JobStartedDataSchema = JobDescriptorResolvedDataSchema.merge(
  z.object({
    status: z.literal("started"),
  })
).strict() satisfies z.ZodType<JobStartedData>;

export const JobCompletedDataSchema = JobDescriptorResolvedDataSchema.merge(
  z.object({
    status: z.literal("success"),
    result: z.record(z.string(), z.unknown()).optional(),
  })
).strict() satisfies z.ZodType<JobCompletedData>;

export const JobFailedDataSchema = JobDescriptorResolvedDataSchema.merge(
  z.object({
    status: z.literal("failure"),
    result: z.record(z.string(), z.unknown()).optional(),
    reason: z.string(),
  })
).strict() satisfies z.ZodType<JobFailedData>;

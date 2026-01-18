import { z } from "zod";
import type { AnyEvent } from "@lcase/types";
import { CloudEventContextSchema } from "../../cloud-context.schema.js";
import {
  JobCompletedDataSchema,
  JobFailedDataSchema,
  JobHttpJsonDataSchema,
  JobHttpJsonQueuedDataSchema,
  JobHttpJsonSubmittedDataSchema,
} from "../job.data.schema.js";
import { JobScopeSchema } from "../job.event.schema.js";
const EntityCapIdSchema = z.object({
  entity: z.literal("httpjson"),
  capid: z.literal("httpjson"),
});

export const JobHttpJsonSubmittedSchema: z.ZodType<
  AnyEvent<"job.httpjson.submitted">
> = z
  .object({
    ...CloudEventContextSchema.shape,
    ...JobScopeSchema.shape,
    ...EntityCapIdSchema.shape,
    type: z.literal("job.httpjson.submitted"),
    action: z.literal("submitted"),
    data: JobHttpJsonSubmittedDataSchema,
  })
  .strict();

export const JobHttpJsonDelayedSchema = z
  .object({
    ...CloudEventContextSchema.shape,
    ...JobScopeSchema.shape,
    ...EntityCapIdSchema.shape,
    type: z.literal("job.httpjson.delayed"),
    action: z.literal("delayed"),

    data: JobHttpJsonDataSchema,
  })
  .strict() satisfies z.ZodType<AnyEvent<"job.httpjson.delayed">>;

export const JobHttpJsonResumedSchema = z
  .object({
    ...CloudEventContextSchema.shape,
    ...JobScopeSchema.shape,
    ...EntityCapIdSchema.shape,
    type: z.literal("job.httpjson.resumed"),
    action: z.literal("resumed"),
    data: JobHttpJsonDataSchema,
  })
  .strict() satisfies z.ZodType<AnyEvent<"job.httpjson.resumed">>;

export const JobHttpJsonQueuedSchema = z
  .object({
    ...CloudEventContextSchema.shape,
    ...JobScopeSchema.shape,
    ...EntityCapIdSchema.shape,
    type: z.literal("job.httpjson.queued"),
    action: z.literal("queued"),
    data: JobHttpJsonQueuedDataSchema,
  })
  .strict() satisfies z.ZodType<AnyEvent<"job.httpjson.queued">>;

export const JobHttpJsonStartedSchema = z
  .object({
    ...CloudEventContextSchema.shape,
    ...JobScopeSchema.shape,
    ...EntityCapIdSchema.shape,
    type: z.literal("job.httpjson.started"),
    action: z.literal("started"),
    data: JobHttpJsonDataSchema,
  })
  .strict() satisfies z.ZodType<AnyEvent<"job.httpjson.started">>;

export const JobHttpJsonCompletedSchema = z
  .object({
    ...CloudEventContextSchema.shape,
    ...JobScopeSchema.shape,
    ...EntityCapIdSchema.shape,
    type: z.literal("job.httpjson.completed"),
    action: z.literal("completed"),
    data: JobCompletedDataSchema,
  })
  .strict() satisfies z.ZodType<AnyEvent<"job.httpjson.completed">>;

export const JobHttpJsonFailedSchema = z
  .object({
    ...CloudEventContextSchema.shape,
    ...JobScopeSchema.shape,
    ...EntityCapIdSchema.shape,
    type: z.literal("job.httpjson.failed"),
    action: z.literal("failed"),
    data: JobFailedDataSchema,
  })
  .strict() satisfies z.ZodType<AnyEvent<"job.httpjson.failed">>;

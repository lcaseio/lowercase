import { z } from "zod";
import { AnyEvent } from "@lcase/types";
import { CloudEventContextSchema } from "../../cloud-context.schema.js";
import {
  JobCompletedDataSchema,
  JobDelayedDataSchema,
  JobFailedDataSchema,
  JobHttpJsonDataSchema,
} from "../job.data.schema.js";
import { JobScopeSchema } from "../job.event.schema.js";

export const JobHttpJsonSubmittedSchema = CloudEventContextSchema.merge(
  JobScopeSchema
)
  .merge(
    z.object({
      type: z.literal("job.httpjson.submitted"),
      entity: z.literal("httpjson"),
      action: z.literal("submitted"),
      capid: z.literal("httpjson"),
      data: JobHttpJsonDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"job.httpjson.submitted">>;

export const JobHttpJsonDelayedSchema = CloudEventContextSchema.merge(
  JobScopeSchema
)
  .merge(
    z.object({
      type: z.literal("job.httpjson.delayed"),
      entity: z.literal("httpjson"),
      action: z.literal("delayed"),
      capid: z.literal("httpjson"),
      data: JobHttpJsonDataSchema.extend(JobDelayedDataSchema.shape),
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"job.httpjson.delayed">>;

export const JobHttpJsonQueuedSchema = CloudEventContextSchema.merge(
  JobScopeSchema
)
  .merge(
    z.object({
      type: z.literal("job.httpjson.queued"),
      entity: z.literal("httpjson"),
      action: z.literal("queued"),
      capid: z.literal("httpjson"),
      data: JobHttpJsonDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"job.httpjson.queued">>;

export const JobHttpJsonStartedSchema = CloudEventContextSchema.merge(
  JobScopeSchema
)
  .merge(
    z.object({
      type: z.literal("job.httpjson.started"),
      entity: z.literal("httpjson"),
      action: z.literal("started"),
      capid: z.literal("httpjson"),
      data: JobHttpJsonDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"job.httpjson.started">>;

export const JobHttpJsonCompletedSchema = CloudEventContextSchema.merge(
  JobScopeSchema
)
  .merge(
    z.object({
      type: z.literal("job.httpjson.completed"),
      entity: z.literal("httpjson"),
      action: z.literal("completed"),
      capid: z.literal("httpjson"),
      data: JobCompletedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"job.httpjson.completed">>;

export const JobHttpJsonFailedSchema = CloudEventContextSchema.merge(
  JobScopeSchema
)
  .merge(
    z.object({
      type: z.literal("job.httpjson.failed"),
      entity: z.literal("httpjson"),
      action: z.literal("failed"),
      capid: z.literal("httpjson"),
      data: JobFailedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"job.httpjson.failed">>;

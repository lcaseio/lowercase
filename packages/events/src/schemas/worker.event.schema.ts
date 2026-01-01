import { z } from "zod";
import { CloudEventContextSchema } from "./cloud-context.schema.js";
import type { AnyEvent, WorkerScope } from "@lcase/types";
import {
  WorkerStartedDataSchema,
  WorkerStoppedDataSchema,
  WorkerProfileAddedDataSchema,
  WorkerProfileSubmittedDataSchema,
  WorkerJobDequeuedDataSchema,
  WorkerSlotRequestedDataSchema,
  WorkerSlotFinishedDataSchema,
} from "./worker.data.schema.js";

export const WorkerContextSchema = z
  .object({
    workerid: z.string(),
    domain: z.literal("worker"),
  })
  .strict() satisfies z.ZodType<WorkerScope>;

export const WorkerStartedSchema = CloudEventContextSchema.merge(
  WorkerContextSchema
)
  .merge(
    z.object({
      type: z.literal("worker.started"),
      entity: z.undefined().optional(),
      action: z.literal("started"),
      data: WorkerStartedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"worker.started">>;

export const WorkerStoppedSchema = CloudEventContextSchema.merge(
  WorkerContextSchema
)
  .merge(
    z.object({
      type: z.literal("worker.stopped"),
      entity: z.undefined().optional(),
      action: z.literal("stopped"),
      data: WorkerStoppedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"worker.stopped">>;

export const WorkerProfileAddedSchema = CloudEventContextSchema.merge(
  WorkerContextSchema
)
  .merge(
    z.object({
      type: z.literal("worker.profile.added"),
      entity: z.literal("profile"),
      action: z.literal("added"),
      data: WorkerProfileAddedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"worker.profile.added">>;

export const WorkerProfileSubmittedSchema = CloudEventContextSchema.merge(
  WorkerContextSchema
)
  .merge(
    z.object({
      type: z.literal("worker.profile.submitted"),
      entity: z.literal("profile"),
      action: z.literal("submitted"),
      data: WorkerProfileSubmittedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"worker.profile.submitted">>;

export const WorkerJobDequeuedSchema = z
  .object({
    ...CloudEventContextSchema.shape,
    ...WorkerContextSchema.shape,
    type: z.literal("worker.job.dequeued"),
    entity: z.literal("job"),
    action: z.literal("dequeued"),
    data: WorkerJobDequeuedDataSchema,
  })
  .strict() satisfies z.ZodType<AnyEvent<"worker.job.dequeued">>;

export const WorkerSlotRequestedSchema = z
  .object({
    ...CloudEventContextSchema.shape,
    ...WorkerContextSchema.shape,
    type: z.literal("worker.slot.requested"),
    entity: z.literal("slot"),
    action: z.literal("requested"),
    data: WorkerSlotRequestedDataSchema,
  })
  .strict() satisfies z.ZodType<AnyEvent<"worker.slot.requested">>;

export const WorkerSlotFinishedSchema = z
  .object({
    ...CloudEventContextSchema.shape,
    ...WorkerContextSchema.shape,
    type: z.literal("worker.slot.finished"),
    entity: z.literal("slot"),
    action: z.literal("finished"),
    data: WorkerSlotFinishedDataSchema,
  })
  .strict() satisfies z.ZodType<AnyEvent<"worker.slot.finished">>;

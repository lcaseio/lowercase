import { z } from "zod";
import type { AnyEvent, FlowScope } from "@lcase/types";
import {
  FlowCompletedDataSchema,
  FlowFailedDataSchema,
  FlowQueuedDataSchema,
  FlowStartedDataSchema,
  FlowSubmittedDataSchema,
} from "./flow-data.schema.js";
import { CloudEventContextSchema } from "./cloud-context.schema.js";

export const FlowContextSchema = z
  .object({
    flowid: z.string(),
    domain: z.literal("flow"),
  })
  .strict() satisfies z.ZodType<FlowScope>;

export const FlowQueuedSchema = CloudEventContextSchema.extend(
  FlowContextSchema.shape
)
  .merge(
    z.object({
      type: z.literal("flow.queued"),
      entity: z.undefined().optional(),
      action: z.literal("queued"),
      data: FlowQueuedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"flow.queued">>;

export const FlowSubmittedSchema = CloudEventContextSchema.extend(
  FlowContextSchema.shape
)
  .merge(
    z.object({
      type: z.literal("flow.submitted"),
      entity: z.undefined().optional(),
      action: z.literal("submitted"),
      data: FlowSubmittedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"flow.submitted">>;

export const FlowStartedSchema = CloudEventContextSchema.merge(
  FlowContextSchema
)
  .merge(
    z.object({
      type: z.literal("flow.started"),
      entity: z.undefined().optional(),
      action: z.literal("started"),
      data: FlowStartedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"flow.started">>;

export const FlowCompletedSchema = CloudEventContextSchema.merge(
  FlowContextSchema
)
  .merge(
    z.object({
      type: z.literal("flow.completed"),
      entity: z.undefined().optional(),
      action: z.literal("completed"),
      data: FlowCompletedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"flow.completed">>;

export const FlowFailedSchema = CloudEventContextSchema.merge(FlowContextSchema)
  .merge(
    z.object({
      type: z.literal("flow.failed"),
      entity: z.undefined().optional(),
      action: z.literal("failed"),
      data: FlowFailedDataSchema,
    })
  )
  .strict() satisfies z.ZodType<AnyEvent<"flow.failed">>;

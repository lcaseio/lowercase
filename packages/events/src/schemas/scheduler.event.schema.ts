import type { SchedulerEvent, SchedulerScope } from "@lcase/types";
import { z } from "zod";
import {
  SchedulerStartedDataSchema,
  SchedulerStoppedDataSchema,
  SchedulerToolRequestedDataSchema,
} from "./scheduler.data.schema.js";
import { CloudEventContextSchema } from "./cloud-context.schema.js";

export const SchedulerScopeSchema = z
  .object({
    schedulerid: z.string(),
  })
  .strict() satisfies z.ZodType<SchedulerScope>;

export const SchedulerToolRequestedSchema = z
  .object({
    ...CloudEventContextSchema.shape,
    ...SchedulerScopeSchema.shape,
    data: SchedulerToolRequestedDataSchema,
    type: z.literal("scheduler.slot.requested"),
    domain: z.literal("scheduler"),
    entity: z.literal("slot"),
    action: z.literal("requested"),
  })
  .strict() satisfies z.ZodType<SchedulerEvent<"scheduler.slot.requested">>;

export const SchedulerStartedSchema = z
  .object({
    ...CloudEventContextSchema.shape,
    ...SchedulerScopeSchema.shape,
    data: SchedulerStartedDataSchema,
    type: z.literal("scheduler.started"),
    domain: z.literal("scheduler"),
    entity: z.undefined().optional(),
    action: z.literal("started"),
  })
  .strict() satisfies z.ZodType<SchedulerEvent<"scheduler.started">>;

export const SchedulerStoppedSchema = z
  .object({
    ...CloudEventContextSchema.shape,
    ...SchedulerScopeSchema.shape,
    data: SchedulerStoppedDataSchema,
    type: z.literal("scheduler.stopped"),
    domain: z.literal("scheduler"),
    entity: z.undefined().optional(),
    action: z.literal("stopped"),
  })
  .strict() satisfies z.ZodType<SchedulerEvent<"scheduler.stopped">>;

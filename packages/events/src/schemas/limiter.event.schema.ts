import type { LimiterEvent, LimiterScope } from "@lcase/types";
import { z } from "zod";
import { CloudEventContextSchema } from "./cloud-context.schema.js";
import {
  LimiterStartedDataSchema,
  LimiterStoppedDataSchema,
  LimiterSlotDeniedDataSchema,
  LimiterSlotGrantedDataSchema,
} from "./limiter.data.schema.js";

export const LimiterScopeSchema = z
  .object({
    limiterid: z.string(),
  })
  .strict() satisfies z.ZodType<LimiterScope>;

export const LimiterSlotDeniedSchema = z
  .object({
    ...CloudEventContextSchema.shape,
    ...LimiterScopeSchema.shape,
    data: LimiterSlotDeniedDataSchema,
    type: z.literal("limiter.slot.denied"),
    domain: z.literal("limiter"),
    entity: z.literal("slot"),
    action: z.literal("denied"),
  })
  .strict() satisfies z.ZodType<LimiterEvent<"limiter.slot.denied">>;

export const LimiterSlotGrantedSchema = z
  .object({
    ...CloudEventContextSchema.shape,
    ...LimiterScopeSchema.shape,
    data: LimiterSlotGrantedDataSchema,
    type: z.literal("limiter.slot.granted"),
    domain: z.literal("limiter"),
    entity: z.literal("slot"),
    action: z.literal("granted"),
  })
  .strict() satisfies z.ZodType<LimiterEvent<"limiter.slot.granted">>;

export const LimiterStoppedSchema = z
  .object({
    ...CloudEventContextSchema.shape,
    ...LimiterScopeSchema.shape,
    data: LimiterStoppedDataSchema,
    type: z.literal("limiter.stopped"),
    domain: z.literal("limiter"),
    entity: z.undefined().optional(),
    action: z.literal("stopped"),
  })
  .strict() satisfies z.ZodType<LimiterEvent<"limiter.stopped">>;

export const LimiterStartedSchema = z
  .object({
    ...CloudEventContextSchema.shape,
    ...LimiterScopeSchema.shape,
    data: LimiterStartedDataSchema,
    type: z.literal("limiter.started"),
    domain: z.literal("limiter"),
    entity: z.undefined().optional(),
    action: z.literal("started"),
  })
  .strict() satisfies z.ZodType<LimiterEvent<"limiter.started">>;

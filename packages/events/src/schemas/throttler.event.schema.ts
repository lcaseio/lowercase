import type { ThrottlerEvent, ThrottlerScope } from "@lcase/types";
import { z } from "zod";
import { CloudEventContextSchema } from "./cloud-context.schema.js";
import {
  ThrottlerStartedDataSchema,
  ThrottlerStoppedDataSchema,
  ThrottlerToolDeniedDataSchema,
  ThrottlerToolGrantedDataSchema,
} from "./throttler.data.schema.js";

export const ThrottlerScopeSchema = z
  .object({
    throttlerid: z.string(),
  })
  .strict() satisfies z.ZodType<ThrottlerScope>;

export const ThrottlerToolDeniedSchema = z
  .object({
    ...CloudEventContextSchema.shape,
    ...ThrottlerScopeSchema.shape,
    data: ThrottlerToolDeniedDataSchema,
    type: z.literal("throttler.tool.denied"),
    domain: z.literal("throttler"),
    entity: z.literal("tool"),
    action: z.literal("denied"),
  })
  .strict() satisfies z.ZodType<ThrottlerEvent<"throttler.tool.denied">>;

export const ThrottlerToolGrantedSchema = z
  .object({
    ...CloudEventContextSchema.shape,
    ...ThrottlerScopeSchema.shape,
    data: ThrottlerToolGrantedDataSchema,
    type: z.literal("throttler.tool.granted"),
    domain: z.literal("throttler"),
    entity: z.literal("tool"),
    action: z.literal("granted"),
  })
  .strict() satisfies z.ZodType<ThrottlerEvent<"throttler.tool.granted">>;

export const ThrottlerStoppedSchema = z
  .object({
    ...CloudEventContextSchema.shape,
    ...ThrottlerScopeSchema.shape,
    data: ThrottlerStoppedDataSchema,
    type: z.literal("throttler.stopped"),
    domain: z.literal("throttler"),
    entity: z.undefined().optional(),
    action: z.literal("stopped"),
  })
  .strict() satisfies z.ZodType<ThrottlerEvent<"throttler.stopped">>;

export const ThrottlerStartedSchema = z
  .object({
    ...CloudEventContextSchema.shape,
    ...ThrottlerScopeSchema.shape,
    data: ThrottlerStartedDataSchema,
    type: z.literal("throttler.started"),
    domain: z.literal("throttler"),
    entity: z.undefined().optional(),
    action: z.literal("started"),
  })
  .strict() satisfies z.ZodType<ThrottlerEvent<"throttler.started">>;

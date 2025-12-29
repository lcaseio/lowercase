import type { ConcurrencyEvent, ConcurrencyScope } from "@lcase/types";
import { z } from "zod";
import { CloudEventContextSchema } from "./cloud-context.schema.js";
import {
  ConcurrencyStartedDataSchema,
  ConcurrencyStoppedDataSchema,
  ConcurrencyToolDeniedDataSchema,
  ConcurrencyToolGrantedDataSchema,
} from "./concurrency.data.schema.js";

export const ConcurrencyScopeSchema = z
  .object({
    concurrencyid: z.string(),
  })
  .strict() satisfies z.ZodType<ConcurrencyScope>;

export const ConcurrencyToolDeniedSchema = z
  .object({
    ...CloudEventContextSchema.shape,
    ...ConcurrencyScopeSchema.shape,
    data: ConcurrencyToolDeniedDataSchema,
    type: z.literal("concurrency.tool.denied"),
    domain: z.literal("concurrency"),
    entity: z.literal("tool"),
    action: z.literal("denied"),
  })
  .strict() satisfies z.ZodType<ConcurrencyEvent<"concurrency.tool.denied">>;

export const ConcurrencyToolGrantedSchema = z
  .object({
    ...CloudEventContextSchema.shape,
    ...ConcurrencyScopeSchema.shape,
    data: ConcurrencyToolGrantedDataSchema,
    type: z.literal("concurrency.tool.granted"),
    domain: z.literal("concurrency"),
    entity: z.literal("tool"),
    action: z.literal("granted"),
  })
  .strict() satisfies z.ZodType<ConcurrencyEvent<"concurrency.tool.granted">>;

export const ConcurrencyStoppedSchema = z
  .object({
    ...CloudEventContextSchema.shape,
    ...ConcurrencyScopeSchema.shape,
    data: ConcurrencyStoppedDataSchema,
    type: z.literal("concurrency.stopped"),
    domain: z.literal("concurrency"),
    entity: z.undefined().optional(),
    action: z.literal("stopped"),
  })
  .strict() satisfies z.ZodType<ConcurrencyEvent<"concurrency.stopped">>;

export const ConcurrencyStartedSchema = z
  .object({
    ...CloudEventContextSchema.shape,
    ...ConcurrencyScopeSchema.shape,
    data: ConcurrencyStartedDataSchema,
    type: z.literal("concurrency.started"),
    domain: z.literal("concurrency"),
    entity: z.undefined().optional(),
    action: z.literal("started"),
  })
  .strict() satisfies z.ZodType<ConcurrencyEvent<"concurrency.started">>;

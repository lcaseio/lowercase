import type {
  LimiterStartedData,
  LimiterStoppedData,
  LimiterSlotDeniedData,
  LimiterSlotGrantedData,
} from "@lcase/types";
import { z } from "zod";

export const LimiterSlotDeniedDataSchema = z
  .object({
    jobId: z.string(),
    runId: z.string(),
    toolId: z.string(),
    status: z.literal("denied"),
    workerId: z.string(),
  })
  .strict() satisfies z.ZodType<LimiterSlotDeniedData>;

export const LimiterSlotGrantedDataSchema = z
  .object({
    jobId: z.string(),
    runId: z.string(),
    toolId: z.string(),
    status: z.literal("granted"),
    workerId: z.string(),
  })
  .strict() satisfies z.ZodType<LimiterSlotGrantedData>;

export const LimiterStartedDataSchema = z
  .object({
    status: z.literal("started"),
  })
  .strict() satisfies z.ZodType<LimiterStartedData>;

export const LimiterStoppedDataSchema = z
  .object({
    status: z.literal("stopped"),
  })
  .strict() satisfies z.ZodType<LimiterStoppedData>;

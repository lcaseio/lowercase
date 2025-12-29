import type {
  ConcurrencyStartedData,
  ConcurrencyStoppedData,
  ConcurrencyToolDeniedData,
  ConcurrencyToolGrantedData,
} from "@lcase/types";
import { z } from "zod";

export const ConcurrencyToolDeniedDataSchema = z
  .object({
    runId: z.string(),
    toolId: z.string(),
    status: z.literal("denied"),
  })
  .strict() satisfies z.ZodType<ConcurrencyToolDeniedData>;

export const ConcurrencyToolGrantedDataSchema = z
  .object({
    runId: z.string(),
    toolId: z.string(),
    status: z.literal("granted"),
  })
  .strict() satisfies z.ZodType<ConcurrencyToolGrantedData>;

export const ConcurrencyStartedDataSchema = z
  .object({
    status: z.literal("started"),
  })
  .strict() satisfies z.ZodType<ConcurrencyStartedData>;

export const ConcurrencyStoppedDataSchema = z
  .object({
    status: z.literal("stopped"),
  })
  .strict() satisfies z.ZodType<ConcurrencyStoppedData>;

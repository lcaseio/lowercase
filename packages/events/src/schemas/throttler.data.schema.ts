import type {
  ThrottlerStartedData,
  ThrottlerStoppedData,
  ThrottlerToolDeniedData,
  ThrottlerToolGrantedData,
} from "@lcase/types";
import { z } from "zod";

export const ThrottlerToolDeniedDataSchema = z
  .object({
    runId: z.string(),
    toolId: z.string(),
    status: z.literal("denied"),
  })
  .strict() satisfies z.ZodType<ThrottlerToolDeniedData>;

export const ThrottlerToolGrantedDataSchema = z
  .object({
    runId: z.string(),
    toolId: z.string(),
    status: z.literal("granted"),
  })
  .strict() satisfies z.ZodType<ThrottlerToolGrantedData>;

export const ThrottlerStartedDataSchema = z
  .object({
    status: z.literal("started"),
  })
  .strict() satisfies z.ZodType<ThrottlerStartedData>;

export const ThrottlerStoppedDataSchema = z
  .object({
    status: z.literal("stopped"),
  })
  .strict() satisfies z.ZodType<ThrottlerStoppedData>;

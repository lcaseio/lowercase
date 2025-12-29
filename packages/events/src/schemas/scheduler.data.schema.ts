import type {
  SchedulerStartedData,
  SchedulerStoppedData,
  SchedulerToolRequestedData,
} from "@lcase/types";
import { z } from "zod";

export const SchedulerToolRequestedDataSchema = z
  .object({
    runId: z.string(),
    toolId: z.string(),
  })
  .strict() satisfies z.ZodType<SchedulerToolRequestedData>;

export const SchedulerStartedDataSchema = z
  .object({
    status: z.literal("started"),
  })
  .strict() satisfies z.ZodType<SchedulerStartedData>;

export const SchedulerStoppedDataSchema = z
  .object({
    status: z.literal("stopped"),
  })
  .strict() satisfies z.ZodType<SchedulerStoppedData>;

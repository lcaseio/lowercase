import type {
  SchedulerSlotRequestedData,
  SchedulerStartedData,
  SchedulerStoppedData,
} from "@lcase/types";
import { z } from "zod";

export const SchedulerToolRequestedDataSchema = z
  .object({
    jobId: z.string(),
    runId: z.string(),
    toolId: z.string(),
  })
  .strict() satisfies z.ZodType<SchedulerSlotRequestedData>;

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

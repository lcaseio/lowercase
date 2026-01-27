import { z } from "zod";
import type {
  StepStartedData,
  StepCompletedData,
  StepFailedData,
  StepPlannedData,
  StepReusedData,
} from "@lcase/types";

const RunDescriptorSchema = z.object({
  step: z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    joinFrom: z.array(z.string()).optional(),
    parallelSteps: z.array(z.string()).optional(),
  }),
});
export const StepStartedDataSchema = RunDescriptorSchema.merge(
  z.object({
    status: z.literal("started"),
  }),
).strict() satisfies z.ZodType<StepStartedData>;

export const StepCompletedDataSchema = RunDescriptorSchema.merge(
  z.object({
    status: z.literal("success"),
    outputHash: z.string().optional(),
  }),
).strict() satisfies z.ZodType<StepCompletedData>;

export const StepFailedDataSchema = RunDescriptorSchema.merge(
  z.object({
    status: z.literal("failure"),
    reason: z.string(),
    outputHash: z.string().optional(),
  }),
).strict() satisfies z.ZodType<StepFailedData>;

export const StepPlannedDataSchema = z
  .object({ ...RunDescriptorSchema.shape })
  .strict() satisfies z.ZodType<StepPlannedData>;

export const StepReusedDataSchema = z
  .object({
    outputHash: z.string().optional(),
    status: z.enum(["success", "failure"]),
    sourceRunId: z.string(),
  })
  .strict() satisfies z.ZodType<StepReusedData>;

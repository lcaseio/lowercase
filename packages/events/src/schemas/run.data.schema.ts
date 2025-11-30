import { z } from "zod";
import type {
  RunStartedData,
  RunCompletedData,
  RunFailedData,
} from "@lcase/types";

const RunDescriptorSchema = z.object({
  run: z.object({
    id: z.string(),
    status: z.string(),
  }),
  engine: z.object({
    id: z.string(),
  }),
});
export const RunStartedDataSchema = RunDescriptorSchema.merge(
  z.object({
    status: z.literal("started"),
  })
).strict() satisfies z.ZodType<RunStartedData>;

export const RunCompletedDataSchema = RunDescriptorSchema.merge(
  z.object({
    status: z.literal("success"),
    message: z.string(),
  })
).strict() satisfies z.ZodType<RunCompletedData>;

export const RunFailedDataSchema = RunDescriptorSchema.merge(
  z.object({
    status: z.literal("failure"),
    message: z.string(),
  })
).strict() satisfies z.ZodType<RunFailedData>;

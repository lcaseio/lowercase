import { z } from "zod";
import type {
  RunStartedData,
  RunCompletedData,
  RunFailedData,
  RunRequestedData,
} from "@lcase/types";

// removed descriptor for now to reduce duplication of data
const RunDescriptorSchema = z.object({
  run: z.object({
    id: z.string(),
    status: z.string(),
  }),
  engine: z.object({
    id: z.string(),
  }),
});

export const RunRequestedDataSchema = z
  .object({
    flowDefHash: z.string(),
    forkSpecHash: z.string().optional(),
  })
  .strict() satisfies z.ZodType<RunRequestedData>;

export const RunStartedDataSchema =
  z.null() satisfies z.ZodType<RunStartedData>;

export const RunCompletedDataSchema =
  RunStartedDataSchema satisfies z.ZodType<RunCompletedData>;

export const RunFailedDataSchema =
  RunStartedDataSchema satisfies z.ZodType<RunFailedData>;

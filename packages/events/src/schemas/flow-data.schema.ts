import { z } from "zod";
import { FlowSchema } from "@lcase/specs";
import type {
  FlowCompletedData,
  FlowFailedData,
  FlowQueuedData,
  FlowStartedData,
  FlowSubmittedData,
} from "@lcase/types";

export const FlowQueuedDataSchema = z
  .object({
    flowName: z.string(),
    inputs: z.record(z.string(), z.unknown()),
    outfile: z.string(),
    test: z.boolean().optional(),
    definition: z.record(z.string(), z.unknown()),
    flow: z.object({
      id: z.string(),
      name: z.string(),
      version: z.string(),
    }),
  })
  .strict() satisfies z.ZodType<FlowQueuedData>;

export const FlowSubmittedDataSchema = z
  .object({
    inputs: z.record(z.string(), z.unknown()),
    definition: FlowSchema,
    flow: z.object({
      id: z.string(),
      name: z.string(),
      version: z.string(),
    }),
  })
  .strict() satisfies z.ZodType<FlowSubmittedData>;

export const FlowStartedDataSchema = z
  .object({
    flow: z.object({
      id: z.string(),
      name: z.string(),
      version: z.string(),
    }),
  })
  .strict() satisfies z.ZodType<FlowStartedData>;

export const FlowCompletedDataSchema = z
  .object({
    flow: z.object({
      id: z.string(),
      name: z.string(),
      version: z.string(),
    }),
    status: z.literal("success"),
  })
  .strict() satisfies z.ZodType<FlowCompletedData>;

export const FlowFailedDataSchema = z
  .object({
    flow: z.object({
      id: z.string(),
      name: z.string(),
      version: z.string(),
    }),
    status: z.literal("failure"),
  })
  .strict() satisfies z.ZodType<FlowFailedData>;

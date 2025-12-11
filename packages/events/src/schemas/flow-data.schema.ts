import { z } from "zod";
import { FlowSchema } from "@lcase/specs";
import type {
  FlowCompletedData,
  FlowDescriptor,
  FlowFailedData,
  FlowQueuedData,
  FlowStartedData,
  FlowSubmittedData,
} from "@lcase/types";

export const FlowDescriptorSchema = z
  .object({
    flow: z.object({
      id: z.string(),
      name: z.string(),
      version: z.string(),
    }),
    run: z.object({ id: z.string() }),
  })
  .strict() satisfies z.ZodType<FlowDescriptor>;

export const FlowQueuedDataSchema = z
  .object({
    ...FlowDescriptorSchema.shape,
    flowName: z.string(),
    inputs: z.record(z.string(), z.unknown()),
    outfile: z.string(),
    definition: FlowSchema,
  })
  .strict() satisfies z.ZodType<FlowQueuedData>;

export const FlowSubmittedDataSchema = z
  .object({
    ...FlowDescriptorSchema.shape,
    inputs: z.record(z.string(), z.unknown()),
    definition: FlowSchema,
  })
  .strict() satisfies z.ZodType<FlowSubmittedData>;

export const FlowStartedDataSchema = z
  .object({
    ...FlowDescriptorSchema.shape,
  })
  .strict() satisfies z.ZodType<FlowStartedData>;

export const FlowCompletedDataSchema = z
  .object({
    ...FlowDescriptorSchema.shape,
    status: z.literal("success"),
  })
  .strict() satisfies z.ZodType<FlowCompletedData>;

export const FlowFailedDataSchema = z
  .object({
    ...FlowDescriptorSchema.shape,
    status: z.literal("failure"),
  })
  .strict() satisfies z.ZodType<FlowFailedData>;

import { z } from "zod";
import { FlowSchema } from "@lcase/specs";
import type {
  FlowCompletedData,
  FlowDescriptor,
  FlowFailedData,
  FlowQueuedData,
  FlowStartedData,
  FlowSubmittedData,
  FlowAnalyzedData,
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

export const FlowAnalyzedDataSchema = z
  .object({
    ...FlowDescriptorSchema.shape,
    analysis: z.object({
      nodes: z.array(z.string()),
      inEdges: z.record(z.string(), z.any()),
      outEdges: z.record(z.string(), z.any()),
      joinDeps: z.record(z.string(), z.any()),
      problems: z.array(z.any()),
      refs: z.array(z.any()),
    }),
  })
  .strict() satisfies z.ZodType<FlowAnalyzedData>;

import { z } from "zod";
import type {
  WorkerDescriptorData,
  WorkerStartedData,
  WorkerStoppedData,
  WorkerProfileSubmittedData,
  WorkerProfileAddedData,
  WorkerJobDequeuedData,
} from "@lcase/types";

const WorkerDescriptorDataSchema = z
  .object({
    worker: z.object({
      id: z.string(),
    }),
  })
  .strict() satisfies z.ZodType<WorkerDescriptorData>;
export const WorkerStartedDataSchema = WorkerDescriptorDataSchema.merge(
  z.object({
    status: z.literal("started"),
  })
).strict() satisfies z.ZodType<WorkerStartedData>;

export const WorkerStoppedDataSchema = WorkerDescriptorDataSchema.merge(
  z.object({
    status: z.literal("stopped"),
  })
).strict() satisfies z.ZodType<WorkerStoppedData>;

export const WorkerProfileSubmittedDataSchema: z.ZodType<WorkerProfileSubmittedData> =
  z
    .object({
      id: z.string(),
      name: z.string(),
      type: z.enum(["internal", "external"]),
      tools: z.array(z.enum(["mcp", "httpjson"])),
    })
    .strict();

export const WorkerProfileAddedDataSchema = z
  .object({
    status: z.literal("accepted"),
    ok: z.literal(true),
  })
  .strict() satisfies z.ZodType<WorkerProfileAddedData>;

export const WorkerJobDequeuedDataSchema = z
  .object({
    eventId: z.string(),
    eventType: z.string(),
    spanId: z.string(),
    flowId: z.string(),
    runId: z.string(),
    stepId: z.string(),
    jobId: z.string(),
    capId: z.string(),
    toolId: z.string(),
  })
  .strict() satisfies z.ZodType<WorkerJobDequeuedData>;

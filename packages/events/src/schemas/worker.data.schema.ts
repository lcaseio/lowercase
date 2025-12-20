import { z } from "zod";
import type {
  WorkerDescriptorData,
  WorkerStartedData,
  WorkerStoppedData,
  WorkerProfileSubmittedData,
  WorkerProfileAddedData,
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

export const WorkerProfileSubmittedDataSchema =
  WorkerDescriptorDataSchema.merge(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(["internal", "external"]),
      tools: z.array(z.enum(["mcp", "httpjson"])),
    })
  ).strict() satisfies z.ZodType<WorkerProfileSubmittedData>;

export const WorkerProfileAddedDataSchema = z
  .object({
    status: z.literal("accepted"),
    ok: z.literal(true),
  })
  .strict() satisfies z.ZodType<WorkerProfileAddedData>;

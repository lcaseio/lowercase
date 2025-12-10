import { z } from "zod";
import type {
  WorkerDescriptorData,
  WorkerStartedData,
  WorkerStoppedData,
  WorkerRegistrationRequestedData,
  WorkerRegisteredData,
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

export const WorkerRegistrationRequestedDataSchema =
  WorkerDescriptorDataSchema.merge(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(["internal", "external"]),
      tools: z.array(z.enum(["mcp", "httpjson"])),
    })
  ).strict() satisfies z.ZodType<WorkerRegistrationRequestedData>;

export const WorkerRegisteredDataSchema = WorkerDescriptorDataSchema.merge(
  z.object({
    workerId: z.string(),
    status: z.string(),
    registeredAt: z.string(),
  })
).strict() satisfies z.ZodType<WorkerRegisteredData>;

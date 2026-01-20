import { z } from "zod";
import type {
  ToolDescriptorData,
  ToolStartedData,
  ToolCompletedData,
  ToolFailedData,
  ToolStatusString,
} from "@lcase/types";
import { jsonValueSchema } from "./json-value.schema.js";

const ToolStatusSchema = z.enum([
  "success",
  "failure",
]) satisfies z.ZodType<ToolStatusString>;
const ToolDescriptorDataSchema = z
  .object({
    tool: z.object({
      id: z.string(),
      name: z.string(),
      version: z.string(),
    }),
  })
  .strict() satisfies z.ZodType<ToolDescriptorData>;
export const ToolStartedDataSchema = ToolDescriptorDataSchema.merge(
  z.object({
    log: z.string(),
  })
).strict() satisfies z.ZodType<ToolStartedData>;

export const ToolCompletedDataSchema = ToolDescriptorDataSchema.merge(
  z.object({
    status: ToolStatusSchema,
    payload: jsonValueSchema.optional(),
  })
).strict() satisfies z.ZodType<ToolCompletedData>;

export const ToolFailedDataSchema = ToolDescriptorDataSchema.merge(
  z.object({
    status: ToolStatusSchema,
    reason: z.string(),
    payload: jsonValueSchema.optional(),
  })
).strict() satisfies z.ZodType<ToolFailedData>;

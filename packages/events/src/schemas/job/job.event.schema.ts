import { z } from "zod";
import type { AnyEvent, JobScope } from "@lcase/types";
import { CloudEventContextSchema } from "../cloud-context.schema.js";
import {
  CapIdSchema,
  JobMcpDataSchema,
  JobMcpResolvedDataSchema,
} from "./job.data.schema.js";

export const JobScopeSchema = z
  .object({
    flowid: z.string(),
    runid: z.string(),
    stepid: z.string(),
    jobid: z.string(),
    capid: CapIdSchema,
    toolid: z.string().nullable(),
    domain: z.literal("job"),
  })
  .strict() satisfies z.ZodType<JobScope>;

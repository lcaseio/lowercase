import { z } from "zod";
import type { JobScope } from "@lcase/types";
import { CapIdSchema } from "./job.data.schema.js";

export const JobScopeSchema = z
  .object({
    flowid: z.string(),
    runid: z.string(),
    stepid: z.string(),
    jobid: z.string(),
    capid: CapIdSchema,
    toolid: z.string(),
    domain: z.literal("job"),
  })
  .strict() satisfies z.ZodType<JobScope>;

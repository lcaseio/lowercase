import { z } from "zod";
import type { StepJoin } from "../../types/dist/flow/join.step.js";

export const StepJoinSchema = z
  .object({
    type: z.literal("join"),
    steps: z.array(z.string()),
    next: z.string(),
  })
  .strict() satisfies z.ZodType<StepJoin>;

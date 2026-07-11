import { z } from "zod";
import type { EvalScorePayload } from "@lcase/types";

export const EvalScorePayloadSchema = z
  .object({
    overall: z.number(),
    passed: z.boolean(),
    dimensions: z.record(
      z.string(),
      z
        .object({
          score: z.number(),
          rationale: z.string().optional(),
        })
        .strict(),
    ),
    rationale: z.string().optional(),
  })
  .strict() satisfies z.ZodType<EvalScorePayload>;

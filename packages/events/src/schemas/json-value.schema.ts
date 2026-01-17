import { z } from "zod";

export const jsonValueSchema = z.union([
  z.string(),
  z.null(),
  z.boolean(),
  z.array(z.unknown()),
  z.record(z.string(), z.unknown()),
]);

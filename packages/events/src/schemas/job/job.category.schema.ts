import { z } from "zod";
import {
  jobCompletedTypes,
  jobQueuedTypes,
  jobSubmittedTypes,
} from "../../registries/category.registry.js";

export const jobSubmittedTypeSchema = z.enum(jobSubmittedTypes);
export const jobQueuedTypeSchema = z.enum(jobQueuedTypes);
export const jobCompletedTypeSchema = z.enum(jobCompletedTypes);

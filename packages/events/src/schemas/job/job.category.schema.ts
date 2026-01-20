import { z } from "zod";
import {
  jobCompletedTypes,
  jobDelayedTypes,
  jobFailedTypes,
  jobQueuedTypes,
  jobResumedTypes,
  jobStartedTypes,
  jobSubmittedTypes,
} from "../../registries/category.registry.js";

export const jobSubmittedTypeSchema = z.enum(jobSubmittedTypes);
export const jobDelayedTypeSchema = z.enum(jobDelayedTypes);
export const jobResumedTypeSchema = z.enum(jobResumedTypes);
export const jobQueuedTypeSchema = z.enum(jobQueuedTypes);
export const jobStartedTypeSchema = z.enum(jobStartedTypes);
export const jobCompletedTypeSchema = z.enum(jobCompletedTypes);
export const jobFailedTypeSchema = z.enum(jobFailedTypes);

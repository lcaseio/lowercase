import {
  JobCompletedType,
  JobDelayedType,
  JobFailedType,
  JobQueuedType,
  JobStartedType,
  JobSubmittedType,
} from "@lcase/types";

// job.*.submitted
export const jobSubmittedTypes = [
  "job.httpjson.submitted",
  "job.mcp.submitted",
] as const satisfies readonly JobSubmittedType[];

type MissingSubmittedTypes = Exclude<
  JobSubmittedType,
  (typeof jobSubmittedTypes)[number]
>;
type _ListsAllSubmittedTypes = MissingSubmittedTypes extends never
  ? true
  : never;
const _checkSubmittedTypes: _ListsAllSubmittedTypes = true;

// job.*.delayed
export const jobDelayedTypes = [
  "job.httpjson.delayed",
  "job.mcp.delayed",
] as const satisfies readonly JobDelayedType[];

type MissingDelayedTypes = Exclude<
  JobDelayedType,
  (typeof jobDelayedTypes)[number]
>;
type _ListsAllDelayedTypes = MissingDelayedTypes extends never ? true : never;
const _checkDelayedTypes: _ListsAllDelayedTypes = true;

// job.*.queued
export const jobQueuedTypes = [
  "job.httpjson.queued",
  "job.mcp.queued",
] as const satisfies readonly JobQueuedType[];

type MissingQueuedTypes = Exclude<
  JobSubmittedType,
  (typeof jobSubmittedTypes)[number]
>;
type _ListsAllQueuedTypes = MissingQueuedTypes extends never ? true : never;
const _checkQueuedTypes: _ListsAllQueuedTypes = true;

// job.*.started
export const jobStartedTypes = [
  "job.httpjson.started",
  "job.mcp.started",
] as const satisfies readonly JobStartedType[];

type MissingStartedTypes = Exclude<
  JobStartedType,
  (typeof jobStartedTypes)[number]
>;
type _ListsAllStartedTypes = MissingStartedTypes extends never ? true : never;
const _checkStartedTypes: _ListsAllStartedTypes = true;

// job.*.completed
export const jobCompletedTypes = [
  "job.httpjson.completed",
  "job.mcp.completed",
] as const satisfies readonly JobCompletedType[];

type MissingCompletedTypes = Exclude<
  JobCompletedType,
  (typeof jobCompletedTypes)[number]
>;
type _ListsAllCompletedTypes = MissingCompletedTypes extends never
  ? true
  : never;
const _checkCompletedTypes: _ListsAllCompletedTypes = true;

// job.*.failed
export const jobFailedTypes = [
  "job.httpjson.failed",
  "job.mcp.failed",
] as const satisfies readonly JobFailedType[];

type MissingFailedTypes = Exclude<
  JobFailedType,
  (typeof jobFailedTypes)[number]
>;
type _ListsAllFailedTypes = MissingFailedTypes extends never ? true : never;
const _checkFailedTypes: _ListsAllFailedTypes = true;

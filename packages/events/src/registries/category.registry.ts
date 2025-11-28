import {
  JobCompletedType,
  JobFailedType,
  JobQueuedType,
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

// job.*.completed
export const jobCompletedTypes = [
  "job.httpjson.completed",
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
] as const satisfies readonly JobFailedType[];

type MissingFailedTypes = Exclude<
  JobFailedType,
  (typeof jobFailedTypes)[number]
>;
type _ListsAllFailedTypes = MissingFailedTypes extends never ? true : never;
const _checkFailedTypes: _ListsAllFailedTypes = true;

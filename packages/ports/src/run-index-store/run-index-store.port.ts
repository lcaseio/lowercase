import type { AnyEvent, RunIndex } from "@lcase/types";

export type RunIndexEvent =
  | AnyEvent<"run.requested">
  | AnyEvent<"run.started">
  | AnyEvent<"run.completed">
  | AnyEvent<"run.failed">
  | AnyEvent<"step.started">
  | AnyEvent<"step.completed">
  | AnyEvent<"step.failed">;

export interface RunIndexStorePort {
  putRunIndex(index: RunIndex, runId: string): Promise<void>;
  getRunIndex(runId: string): Promise<RunIndex | undefined>;
}

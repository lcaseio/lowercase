import type { AnyEvent } from "@lcase/types";

export type RunIndex = {
  flowId: string;
  traceId: string;
  flowDefHash?: string;
  forkSpecHash?: string;
  parentId?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  steps: Record<
    string,
    {
      outputHash?: string;
      status?: string;
      startTime?: string;
      endTime?: string;
      duration?: number;
      argsHash?: string;
    }
  >;
};
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

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
      status: string;
      startTime?: string;
      endTime?: string;
      duration?: number;
      argsHash?: string;
    }
  >;
};

export interface RunIndexStorePort {
  processEvent(event: AnyEvent): Promise<void>;
}

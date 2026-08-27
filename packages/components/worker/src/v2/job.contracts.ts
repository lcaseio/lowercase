import type { JsonValue, Ref } from "@lcase/types";

// Minimal, deliberately provisional -- the doc's own "Open Questions That Do
// Not Block Phase 1" leaves the final artifact/export reference shape open.
export type ArtifactRef = {
  hash: string;
};

// Placeholder only. Phase 2 replaces this with the real HTTP JSON request
// shape once that vertical slice exists -- `kind` just needs to be enough
// for a fixed protocol-executor table to dispatch on later.
export type ProtocolRequest = {
  kind: string;
  payload: JsonValue;
};

export type ExecuteJobCommand = {
  executionId: string;
  jobId: string;
  runId: string;
  stepId: string;
  traceId?: string;
  protocol: ProtocolRequest;
  refs: Ref[];
  exports?: Record<string, ArtifactRef>;
};

export type JobExecutionError = {
  code: string;
  message: string;
  retryable: boolean;
};

export type JobResult =
  | {
      status: "completed";
      executionId: string;
      jobId: string;
      output: ArtifactRef;
      exports?: Record<string, ArtifactRef>;
    }
  | {
      status: "failed";
      executionId: string;
      jobId: string;
      error: JobExecutionError;
      output?: ArtifactRef;
    };

export type JobExecutionOptions = {
  signal?: AbortSignal;
};

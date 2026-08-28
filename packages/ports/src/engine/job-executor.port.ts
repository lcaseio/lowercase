import type { ExportRef, JsonValue, Ref } from "@lcase/types";

// Engine-owned outbound port (Worker V2 plan, Phase 4): the engine's own
// vocabulary for asking something to execute a job and awaiting the terminal
// result -- deliberately not a re-export of worker's ExecuteJobCommand/JobResult
// (packages/components/worker/src/v2/job.contracts.ts), even though the shapes
// mirror each other today, so this contract can't accidentally couple to
// worker's internal shape changing later. A local adapter translates between
// the two; see packages/integrations's engine-worker subpath.
export interface JobExecutorPort {
  execute(
    request: JobExecutionRequest,
    options?: JobExecutorOptions,
  ): Promise<JobExecutionOutcome>;
}

export type JobExecutorOptions = {
  signal?: AbortSignal;
};

export type HttpJsonMethod =
  "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export type JobExecutionRequest = {
  jobId: string;
  runId: string;
  stepId: string;
  traceId?: string;
  protocol: {
    kind: "httpjson";
    url: string;
    method?: HttpJsonMethod;
    headers?: Record<string, string>;
    body?: JsonValue;
  };
  refs: Ref[];
  exports?: Record<string, ExportRef>;
};

export type JobExecutionOutcome =
  | {
      status: "completed";
      output: { hash: string };
      exports?: Record<string, { hash: string }>;
    }
  | {
      status: "failed";
      error: { code: string; message: string; retryable: boolean };
      output?: { hash: string };
    };

import type { JobScope, JobHttpJsonSubmittedData } from "@lcase/types";

// The engine <-> worker job-execution capability, named once and shared by
// both sides rather than split into a caller-owned outbound port and a
// provider-owned inbound port with an integration adapter translating
// between them. The worker provides this capability; the engine consumes it;
// neither imports the other, because the contract lives here instead.
//
// The shared vocabulary is deliberately the *message* -- JobExecutionRequest
// is the real `job.httpjson.submitted` envelope (JobScope +
// JobHttpJsonSubmittedData), not either component's internal shape. Each core
// translates at its own boundary: worker turns a request into its own
// ExecuteJobCommand, and does so identically whether the message arrived by
// direct in-process call or off a message log. That keeps observability
// honest -- what gets recorded is the same object the components exchanged.
//
// See docs/component-architecture/model.md's Port Ownership section for the
// rule this follows, and
// docs/initiatives/swappable-infrastructure/arcs/queue-adapter.md's Change C8
// for why the earlier two-port shape was retired.
export interface JobExecutionPort {
  execute(
    request: JobExecutionRequest,
    options?: JobExecutionOptions,
  ): Promise<JobExecutionOutcome>;
}

export type JobExecutionOptions = {
  signal?: AbortSignal;
};

export type JobExecutionRequest = JobScope & {
  traceId: string;
} & JobHttpJsonSubmittedData;

// Deliberately narrower than worker's own JobResult: the identity fields
// (executionId/jobId) are worker's internal bookkeeping, and the caller
// already knows which request it issued.
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

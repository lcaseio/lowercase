import type {
  ExecuteJobCommand,
  HttpJsonWork,
  JobRunContext,
} from "../../src/job.contracts.js";

// Worker's entry point still speaks the direct-boundary command; JobRunner
// speaks work + context. Separate fixtures rather than one derived from the
// other, so a runner test never has to dress its input as a command first.

export function makeCommand(
  overrides?: Partial<ExecuteJobCommand>,
): ExecuteJobCommand {
  return {
    jobId: "job-1",
    runId: "run-1",
    stepId: "step-1",
    protocol: { kind: "httpjson", url: "https://example.test/resource" },
    refs: [],
    ...overrides,
  };
}

export function makeWork(overrides?: Partial<HttpJsonWork>): HttpJsonWork {
  return {
    protocol: { kind: "httpjson", url: "https://example.test/resource" },
    refs: [],
    ...overrides,
  };
}

export function makeContext(overrides?: Partial<JobRunContext>): JobRunContext {
  return { permitRequestId: "job-1", ...overrides };
}

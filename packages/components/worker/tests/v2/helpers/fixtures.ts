import type { ExecuteJobCommand } from "../../../src/v2/job.contracts.js";

export function makeCommand(
  overrides?: Partial<ExecuteJobCommand>,
): ExecuteJobCommand {
  return {
    executionId: "exec-1",
    jobId: "job-1",
    runId: "run-1",
    stepId: "step-1",
    protocol: { kind: "fake", payload: null },
    refs: [],
    ...overrides,
  };
}

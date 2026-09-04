import { describe, expect, it } from "vitest";
import { withMessageJobExecution } from "../src/message-job-execution.js";
import type {
  ExecuteJobCommand,
  JobCommandExecutor,
  JobResult,
} from "../src/job.contracts.js";
import type { JobExecutionRequest } from "@lcase/ports";

function makeRequest(): JobExecutionRequest {
  return {
    flowid: "flow-1",
    flowversionid: "flowversion-1",
    runid: "run-1",
    stepid: "step-1",
    jobid: "job-1",
    capid: "httpjson",
    toolid: "httpjson",
    traceId: "trace-1",
    url: "https://example.test/resource",
    refs: [],
  };
}

class FakeCommandExecutor implements JobCommandExecutor {
  received: ExecuteJobCommand[] = [];
  constructor(private readonly result: JobResult) {}
  async execute(command: ExecuteJobCommand): Promise<JobResult> {
    this.received.push(command);
    return this.result;
  }
}

describe("withMessageJobExecution", () => {
  it("translates the request into an ExecuteJobCommand and calls the core", async () => {
    const core = new FakeCommandExecutor({
      status: "completed",
      executionId: "job-1",
      jobId: "job-1",
      output: { hash: "output-hash" },
    });
    const jobExecution = withMessageJobExecution(core);

    const outcome = await jobExecution.execute(makeRequest());

    expect(core.received).toHaveLength(1);
    expect(core.received[0]).toMatchObject({
      jobId: "job-1",
      executionId: "job-1",
      runId: "run-1",
      stepId: "step-1",
    });
    expect(outcome).toEqual({
      status: "completed",
      output: { hash: "output-hash" },
      exports: undefined,
    });
  });

  it("translates a failed JobResult into a failed JobExecutionOutcome", async () => {
    const core = new FakeCommandExecutor({
      status: "failed",
      executionId: "job-1",
      jobId: "job-1",
      error: { code: "TIMEOUT", message: "took too long", retryable: true },
    });
    const jobExecution = withMessageJobExecution(core);

    const outcome = await jobExecution.execute(makeRequest());

    expect(outcome).toEqual({
      status: "failed",
      error: { code: "TIMEOUT", message: "took too long", retryable: true },
      output: undefined,
    });
  });
});

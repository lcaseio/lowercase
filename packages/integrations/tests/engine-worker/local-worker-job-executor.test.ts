import { describe, expect, it } from "vitest";
import { LocalWorkerJobExecutor } from "../../src/engine-worker/local-worker-job-executor.js";
import type {
  JobExecutionPort,
  ExecuteJobCommand,
  JobResult,
} from "@lcase/worker";
import type { JobExecutionRequest } from "@lcase/ports/engine";

function makeRequest(): JobExecutionRequest {
  return {
    jobId: "job-1",
    runId: "run-1",
    stepId: "step-1",
    traceId: "trace-1",
    protocol: { kind: "httpjson", url: "https://example.test/resource" },
    refs: [],
  };
}

class FakeJobExecution implements JobExecutionPort {
  received: ExecuteJobCommand[] = [];
  constructor(private readonly result: JobResult) {}
  async execute(command: ExecuteJobCommand): Promise<JobResult> {
    this.received.push(command);
    return this.result;
  }
}

describe("LocalWorkerJobExecutor", () => {
  it("translates the request into an ExecuteJobCommand and calls worker.execute()", async () => {
    const fakeWorker = new FakeJobExecution({
      status: "completed",
      executionId: "job-1",
      jobId: "job-1",
      output: { hash: "output-hash" },
    });
    const executor = new LocalWorkerJobExecutor(fakeWorker);

    const outcome = await executor.execute(makeRequest());

    expect(fakeWorker.received).toHaveLength(1);
    expect(fakeWorker.received[0]).toMatchObject({
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
    const fakeWorker = new FakeJobExecution({
      status: "failed",
      executionId: "job-1",
      jobId: "job-1",
      error: { code: "TIMEOUT", message: "took too long", retryable: true },
    });
    const executor = new LocalWorkerJobExecutor(fakeWorker);

    const outcome = await executor.execute(makeRequest());

    expect(outcome).toEqual({
      status: "failed",
      error: { code: "TIMEOUT", message: "took too long", retryable: true },
      output: undefined,
    });
  });
});

import { describe, expect, it } from "vitest";
import {
  toExecuteJobCommand,
  toJobExecutionOutcome,
} from "../../src/engine-worker/mapper.js";
import type { JobExecutionRequest } from "@lcase/ports/engine";
import type { JobResult } from "@lcase/worker";

function makeRequest(
  overrides?: Partial<JobExecutionRequest>,
): JobExecutionRequest {
  return {
    jobId: "job-1",
    runId: "run-1",
    stepId: "step-1",
    traceId: "trace-1",
    protocol: {
      kind: "httpjson",
      url: "https://example.test/resource",
    },
    refs: [],
    ...overrides,
  };
}

describe("toExecuteJobCommand", () => {
  it("maps request fields onto ExecuteJobCommand, reusing jobId as executionId", () => {
    const request = makeRequest({
      protocol: {
        kind: "httpjson",
        url: "https://example.test/resource",
        method: "POST",
        headers: { "x-test": "1" },
        body: { hello: "world" },
      },
      refs: [
        {
          valuePath: [],
          scope: "params",
          stepId: "step-1",
          bindPath: [],
          string: "params.foo",
          interpolated: false,
          hash: "hash-1",
        },
      ],
      exports: {
        thing: {
          exportName: "thing",
          valuePath: ["output", "thing"],
          scope: "output",
          string: "output.thing",
          type: "application/json",
        },
      },
    });

    expect(toExecuteJobCommand(request)).toEqual({
      executionId: "job-1",
      jobId: "job-1",
      runId: "run-1",
      stepId: "step-1",
      traceId: "trace-1",
      protocol: request.protocol,
      refs: request.refs,
      exports: request.exports,
    });
  });

  it("passes exports as undefined when the request has none", () => {
    const command = toExecuteJobCommand(makeRequest());
    expect(command.exports).toBeUndefined();
  });
});

describe("toJobExecutionOutcome", () => {
  it("passes a completed JobResult through unchanged in shape", () => {
    const result: JobResult = {
      status: "completed",
      executionId: "job-1",
      jobId: "job-1",
      output: { hash: "output-hash" },
      exports: { thing: { hash: "thing-hash" } },
    };
    expect(toJobExecutionOutcome(result)).toEqual({
      status: "completed",
      output: { hash: "output-hash" },
      exports: { thing: { hash: "thing-hash" } },
    });
  });

  it("passes a failed JobResult through unchanged in shape", () => {
    const result: JobResult = {
      status: "failed",
      executionId: "job-1",
      jobId: "job-1",
      error: { code: "HTTP_NETWORK_FAILED", message: "boom", retryable: true },
    };
    expect(toJobExecutionOutcome(result)).toEqual({
      status: "failed",
      error: { code: "HTTP_NETWORK_FAILED", message: "boom", retryable: true },
      output: undefined,
    });
  });
});

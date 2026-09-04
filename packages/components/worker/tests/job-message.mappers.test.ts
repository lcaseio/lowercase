import { describe, expect, it } from "vitest";
import {
  toExecuteJobCommand,
  toJobExecutionOutcome,
} from "../src/job-message.mappers.js";
import type { JobExecutionRequest } from "@lcase/ports";
import type { JobResult } from "../src/job.contracts.js";

function makeRequest(
  overrides?: Partial<JobExecutionRequest>,
): JobExecutionRequest {
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
    ...overrides,
  };
}

describe("toExecuteJobCommand", () => {
  it("maps request fields onto ExecuteJobCommand, reusing jobid as executionId", () => {
    const request = makeRequest({
      method: "POST",
      headers: { "x-test": "1" },
      body: { hello: "world" },
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
      exportRefs: {
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
      protocol: {
        kind: "httpjson",
        url: request.url,
        method: request.method,
        headers: request.headers,
        body: request.body,
      },
      refs: request.refs,
      exports: request.exportRefs,
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

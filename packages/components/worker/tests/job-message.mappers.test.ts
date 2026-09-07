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
  it("maps request fields onto ExecuteJobCommand without renaming any of them", () => {
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
      exportRefs: request.exportRefs,
    });
  });

  it("passes exportRefs as undefined when the request has none", () => {
    const command = toExecuteJobCommand(makeRequest());
    expect(command.exportRefs).toBeUndefined();
  });

  // Documenting a deliberately preserved gap rather than a desired behavior:
  // `args` is part of the submitted schema and has never had any HTTP
  // execution semantics. It is dropped here, and nothing downstream of this
  // point can see it. Giving it meaning, or removing it from the schema, is
  // separate work -- this test exists so the silence is a decision.
  it("drops args, which has no HTTP execution semantics anywhere in worker", () => {
    const command = toExecuteJobCommand(
      makeRequest({ args: { retries: 3, mode: "fast" } }),
    );

    expect(command).not.toHaveProperty("args");
    expect(command.protocol).not.toHaveProperty("args");
  });
});

describe("toJobExecutionOutcome", () => {
  it("passes a completed JobResult through unchanged in shape", () => {
    const result: JobResult = {
      status: "completed",
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

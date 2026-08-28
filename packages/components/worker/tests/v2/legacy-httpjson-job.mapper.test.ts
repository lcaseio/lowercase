import { describe, expect, it } from "vitest";
import {
  toCompatibilityCompletedData,
  toCompatibilityFailedData,
  toEmitOptions,
  toExecuteJobCommand,
} from "../../src/v2/adapters/inbound/legacy-httpjson-job.mapper.js";
import { makeQueuedEvent } from "./helpers/fixtures.js";
import type { JobResult } from "../../src/v2/job.contracts.js";

describe("toExecuteJobCommand", () => {
  it("maps queued-event fields onto ExecuteJobCommand, reusing jobId as executionId", () => {
    const event = makeQueuedEvent({
      url: "https://example.test/resource",
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

    const command = toExecuteJobCommand(event);

    expect(command).toEqual({
      executionId: "job-1",
      jobId: "job-1",
      runId: "run-1",
      stepId: "step-1",
      traceId: "trace-1",
      protocol: {
        kind: "httpjson",
        url: "https://example.test/resource",
        method: "POST",
        headers: { "x-test": "1" },
        body: { hello: "world" },
      },
      refs: event.data.refs,
      exports: event.data.exportRefs,
    });
  });

  it("passes exports as undefined when the queued event has no exportRefs", () => {
    const event = makeQueuedEvent();
    const command = toExecuteJobCommand(event);
    expect(command.exports).toBeUndefined();
  });
});

describe("toCompatibilityCompletedData", () => {
  it("unwraps output/export hashes, omitting exportHashes when there are no exports", () => {
    const result: Extract<JobResult, { status: "completed" }> = {
      status: "completed",
      executionId: "exec-1",
      jobId: "job-1",
      output: { hash: "output-hash" },
    };
    expect(toCompatibilityCompletedData(result)).toEqual({
      status: "success",
      output: "output-hash",
    });
  });

  it("includes exportHashes when exports are present", () => {
    const result: Extract<JobResult, { status: "completed" }> = {
      status: "completed",
      executionId: "exec-1",
      jobId: "job-1",
      output: { hash: "output-hash" },
      exports: { thing: { hash: "thing-hash" } },
    };
    expect(toCompatibilityCompletedData(result)).toEqual({
      status: "success",
      output: "output-hash",
      exportHashes: { thing: "thing-hash" },
    });
  });
});

describe("toCompatibilityFailedData", () => {
  it("uses null output when absent, and the error's message", () => {
    const result: Extract<JobResult, { status: "failed" }> = {
      status: "failed",
      executionId: "exec-1",
      jobId: "job-1",
      error: { code: "HTTP_NETWORK_FAILED", message: "boom", retryable: true },
    };
    expect(toCompatibilityFailedData(result)).toEqual({
      status: "failure",
      output: null,
      message: "boom",
    });
  });

  it("carries a parseable failure payload's output hash when present", () => {
    const result: Extract<JobResult, { status: "failed" }> = {
      status: "failed",
      executionId: "exec-1",
      jobId: "job-1",
      output: { hash: "failure-output-hash" },
      error: {
        code: "HTTP_STATUS_FAILED",
        message: "HTTP 500",
        retryable: true,
      },
    };
    expect(toCompatibilityFailedData(result)).toEqual({
      status: "failure",
      output: "failure-output-hash",
      message: "HTTP 500",
    });
  });
});

describe("toEmitOptions", () => {
  it("derives JobScope fields, source, and fromEvent from the original queued event", () => {
    const event = makeQueuedEvent();
    const options = toEmitOptions(event, "lowercase://worker/worker-1");

    expect(options).toEqual({
      flowid: event.flowid,
      flowversionid: event.flowversionid,
      runid: event.runid,
      stepid: event.stepid,
      jobid: event.jobid,
      capid: event.capid,
      toolid: event.toolid,
      source: "lowercase://worker/worker-1",
      fromEvent: event,
    });
  });
});

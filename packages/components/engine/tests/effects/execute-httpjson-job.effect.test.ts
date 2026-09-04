import { describe, expect, it, vi } from "vitest";
import type { JobExecutionPort } from "@lcase/ports";
import type {
  EffectHandlerDeps,
  ExecuteHttpJsonJobFx,
} from "../../src/engine.types.js";
import { executeHttpJsonJobFx } from "../../src/effects/execute-httpjson-job.effect.js";

function makeEffect(): ExecuteHttpJsonJobFx {
  return {
    type: "ExecuteHttpJsonJob",
    request: {
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
    },
    scope: {
      flowid: "flow-1",
      flowversionid: "flowversion-1",
      runid: "run-1",
      stepid: "step-1",
      jobid: "job-1",
      capid: "httpjson",
      toolid: "httpjson",
    },
    traceId: "trace-1",
  };
}

describe("executeHttpJsonJobFx()", () => {
  it("calls the job executor, enqueues JobFinished, and publishes the compat completed event", async () => {
    const execute = vi.fn().mockResolvedValue({
      status: "completed",
      output: { hash: "output-hash" },
    });
    const jobExecution = { execute } as unknown as JobExecutionPort;
    const publish = vi.fn().mockResolvedValue(undefined);
    const bus = { publish } as unknown as EffectHandlerDeps["bus"];
    const enqueue = vi.fn();
    const processAll = vi.fn();

    await executeHttpJsonJobFx(makeEffect(), {
      jobExecution,
      bus,
      enqueue,
      processAll,
      source: "lowercase://engine",
    } as unknown as EffectHandlerDeps);

    expect(execute).toHaveBeenCalledExactlyOnceWith(makeEffect().request);

    expect(enqueue).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        type: "JobFinished",
        event: expect.objectContaining({
          type: "job.httpjson.completed",
          runid: "run-1",
          stepid: "step-1",
          data: expect.objectContaining({
            status: "success",
            output: "output-hash",
          }),
        }),
      }),
    );
    expect(processAll).toHaveBeenCalledOnce();

    expect(publish).toHaveBeenCalledExactlyOnceWith(
      "job.httpjson.completed",
      expect.objectContaining({ type: "job.httpjson.completed" }),
    );

    // The same built event both feeds JobFinished and gets published --
    // not two separately-constructed objects.
    const enqueuedEvent = enqueue.mock.calls[0][0].event;
    const publishedEvent = publish.mock.calls[0][1];
    expect(enqueuedEvent).toBe(publishedEvent);
  });

  it("calls the job executor, enqueues JobFinished, and publishes the compat failed event", async () => {
    const execute = vi.fn().mockResolvedValue({
      status: "failed",
      error: { code: "TIMEOUT", message: "took too long", retryable: true },
    });
    const jobExecution = { execute } as unknown as JobExecutionPort;
    const publish = vi.fn().mockResolvedValue(undefined);
    const bus = { publish } as unknown as EffectHandlerDeps["bus"];
    const enqueue = vi.fn();
    const processAll = vi.fn();

    await executeHttpJsonJobFx(makeEffect(), {
      jobExecution,
      bus,
      enqueue,
      processAll,
      source: "lowercase://engine",
    } as unknown as EffectHandlerDeps);

    expect(enqueue).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        type: "JobFinished",
        event: expect.objectContaining({
          type: "job.httpjson.failed",
          data: expect.objectContaining({
            status: "failure",
            output: null,
            message: "took too long",
          }),
        }),
      }),
    );
    expect(publish).toHaveBeenCalledExactlyOnceWith(
      "job.httpjson.failed",
      expect.objectContaining({ type: "job.httpjson.failed" }),
    );
  });
});

import type { JobExecutionRequest } from "@lcase/ports";
import { describe, expect, it, vi } from "vitest";
import { createHttpJsonExecutor } from "../src/protocol/http-json/http-json.executor.js";
import { Worker } from "../src/worker.js";
import { makeCommand } from "./helpers/fixtures.js";
import { createFakeArtifactReaderPort } from "./helpers/fake-artifact-reader.js";
import { createFakeArtifactWriterPort } from "./helpers/fake-artifact-writer.js";
import { createFakeLifecycleSink } from "./helpers/fake-lifecycle-sink.js";
import {
  createControllablePermitPort,
  createFakePermitPort,
} from "./helpers/fake-resource-permit.js";
import { GENEROUS_CONFIG, makeWorker } from "./helpers/worker-fakes.js";
import {
  makeJobExecutionCancelledEvent,
  makeJobExecutionCompletedEvent,
  makeJobExecutionFailedEvent,
} from "../src/worker-lifecycle.events.js";

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

// Worker's own responsibilities: capacity, the accepted/started/terminal
// lifecycle sequence, and turning JobRunner's modelled outcome into a
// JobResult. The one-job mechanics behind those outcomes are covered by the
// job-runner tests.
describe("Worker", () => {
  it("success: completes and records started+completed facts", async () => {
    const { worker, events } = makeWorker({
      protocolResult: () => ({ ok: true, payload: { foo: "bar" } }),
    });
    const command = makeCommand();

    const result = await worker.executeCommand(command);

    if (result.status !== "completed") {
      throw new Error(`expected completed, got ${result.status}`);
    }
    expect(result.executionId).toBe(command.executionId);
    expect(result.jobId).toBe(command.jobId);
    expect(result.output.hash).toMatch(/^fake-hash-/);

    expect(events).toHaveLength(2);
    expect(events[0]!.kind).toBe("job-execution-started");
    expect(events[1]).toEqual({
      ...makeJobExecutionCompletedEvent(command, result.output),
      time: expect.any(String),
    });
    expect(events[1]).not.toHaveProperty("payload");
    expect(events[1]).not.toHaveProperty("body");
  });

  it("expected failure: resolves (not rejects) a failed JobResult and records started+failed facts", async () => {
    const protocolError = {
      code: "HTTP_STATUS_FAILED" as const,
      message: "upstream said no",
      retryable: true,
    };
    const { worker, events } = makeWorker({
      protocolResult: () => ({ ok: false, error: protocolError }),
    });
    const command = makeCommand();

    await expect(worker.executeCommand(command)).resolves.toMatchObject({
      status: "failed",
      executionId: command.executionId,
      jobId: command.jobId,
      error: protocolError,
    });

    expect(events).toHaveLength(2);
    expect(events[0]!.kind).toBe("job-execution-started");
    expect(events[1]).toEqual({
      ...makeJobExecutionFailedEvent(command, protocolError),
      time: expect.any(String),
    });
  });

  it("cancellation: records a distinct cancelled fact and returns a CANCELLED result without an output", async () => {
    const permits = createControllablePermitPort();
    const { worker, events } = makeWorker({ permits });
    const command = makeCommand();
    const controller = new AbortController();

    const resultPromise = worker.executeCommand(command, controller.signal);
    await vi.waitFor(() => expect(permits.acquire).toHaveBeenCalled());
    controller.abort();
    const result = await resultPromise;

    expect(result).toMatchObject({
      status: "failed",
      executionId: command.executionId,
      jobId: command.jobId,
      error: { code: "CANCELLED", retryable: false },
    });
    expect(result).not.toHaveProperty("output");

    expect(events).toHaveLength(2);
    expect(events[0]!.kind).toBe("job-execution-started");
    expect(events[1]).toEqual({
      ...makeJobExecutionCancelledEvent(command),
      time: expect.any(String),
    });
  });

  it("thrown invariant failure: rejects before ever touching lifecycle or permits", async () => {
    const { worker, events, acquire, release } = makeWorker();

    await expect(
      worker.executeCommand(makeCommand({ stepId: "" })),
    ).rejects.toThrow();

    expect(events).toHaveLength(0);
    expect(acquire).not.toHaveBeenCalled();
    expect(release).not.toHaveBeenCalled();
  });

  it("an unexpected throw from the runner records no terminal fact and propagates", async () => {
    const thrown = new Error("boom");
    const { worker, events } = makeWorker({
      protocolResult: () => {
        throw thrown;
      },
    });

    await expect(worker.executeCommand(makeCommand())).rejects.toThrow(thrown);

    expect(events).toHaveLength(1);
    expect(events[0]!.kind).toBe("job-execution-started");
  });

  it("end to end: a real HTTP JSON job (fake fetch) completes with an export", async () => {
    const { sink, events } = createFakeLifecycleSink();
    const { port: permits } = createFakePermitPort();
    const { reader } = createFakeArtifactReaderPort();
    const { writer, store } = createFakeArtifactWriterPort();
    const fakeFetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ greeting: "hello world" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    const worker = new Worker(
      {
        permits,
        lifecycle: sink,
        protocol: createHttpJsonExecutor({
          fetch: fakeFetch as unknown as typeof fetch,
        }),
        artifacts: { ...reader, ...writer },
      },
      GENEROUS_CONFIG,
    );
    const command = makeCommand({
      protocol: { kind: "httpjson", url: "https://example.test/greet" },
      exports: {
        greeting: {
          exportName: "greeting",
          valuePath: ["output", "greeting"],
          scope: "output",
          string: "steps.x.exports.greeting",
          type: "text/plain",
        },
      },
    });

    const result = await worker.executeCommand(command);

    expect(fakeFetch).toHaveBeenCalledTimes(1);
    if (result.status !== "completed") {
      throw new Error(`expected completed, got ${JSON.stringify(result)}`);
    }
    expect(store.get(result.output.hash)).toEqual({
      contentType: "application/json",
      content: { greeting: "hello world" },
    });
    expect(store.get(result.exports!.greeting!.hash)).toEqual({
      contentType: "text/plain",
      content: "hello world",
    });
    expect(events.map((e) => e.kind)).toEqual([
      "job-execution-started",
      "job-execution-completed",
    ]);
  });

  // The temporary direct method, deleted in the Message cutover. Kept honest
  // in the meantime: the engine still depends on exactly this translation.
  describe("temporary direct execute(request)", () => {
    it("translates the request into a command and the result into a completed outcome", async () => {
      const { worker, store, protocolExecute } = makeWorker({
        protocolResult: () => ({ ok: true, payload: { greeting: "hi" } }),
      });

      const outcome = await worker.execute(makeRequest());

      if (outcome.status !== "completed") {
        throw new Error(`expected completed, got ${outcome.status}`);
      }
      expect(store.get(outcome.output.hash)).toEqual({
        contentType: "application/json",
        content: { greeting: "hi" },
      });
      expect(outcome).not.toHaveProperty("executionId");
      expect(outcome).not.toHaveProperty("jobId");
      expect(protocolExecute).toHaveBeenCalledTimes(1);
      const [requestArg] = protocolExecute.mock.calls[0]!;
      expect(requestArg).toMatchObject({
        url: "https://example.test/resource",
      });
    });

    it("translates a failed result into a failed outcome", async () => {
      const error = {
        code: "HTTP_STATUS_FAILED" as const,
        message: "upstream said no",
        retryable: true,
      };
      const { worker } = makeWorker({
        protocolResult: () => ({ ok: false, error }),
      });

      const outcome = await worker.execute(makeRequest());

      expect(outcome).toEqual({ status: "failed", error, output: undefined });
    });
  });
});

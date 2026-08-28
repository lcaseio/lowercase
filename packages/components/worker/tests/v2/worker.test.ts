import { describe, expect, it, vi } from "vitest";
import { createWorkerV2 } from "../../src/v2/worker.js";
import type { WorkerV2Config } from "../../src/v2/worker.js";
import {
  makeJobExecutionCancelledEvent,
  makeJobExecutionCompletedEvent,
  makeJobExecutionFailedEvent,
  makeJobExecutionStartedEvent,
} from "../../src/v2/worker-lifecycle.events.js";
import { makeCommand } from "./helpers/fixtures.js";
import { createFakeLifecycleSink } from "./helpers/fake-lifecycle-sink.js";
import {
  createControllablePermitPort,
  createFakePermitPort,
} from "./helpers/fake-resource-permit.js";
import { createFakeArtifactsPort } from "./helpers/fake-artifacts.js";
import { createFakeProtocolExecutor } from "./helpers/fake-protocol-executor.js";

const GENEROUS_CONFIG: WorkerV2Config = {
  maxConcurrentJobs: 10,
  protocolTimeoutMs: 5_000,
};

describe("WorkerV2", () => {
  it("success: completes, stores output, records started+completed facts, releases the permit", async () => {
    const { sink, events } = createFakeLifecycleSink();
    const { port: permits, acquire, release } = createFakePermitPort();
    const { artifacts } = createFakeArtifactsPort();
    const { executor: protocol, execute: protocolExecute } =
      createFakeProtocolExecutor(() => ({ ok: true, payload: { foo: "bar" } }));
    const worker = createWorkerV2(
      { permits, lifecycle: sink, protocol, artifacts },
      GENEROUS_CONFIG,
    );
    const command = makeCommand();

    const result = await worker.execute(command);

    if (result.status !== "completed") {
      throw new Error(`expected completed, got ${result.status}`);
    }
    expect(result.executionId).toBe(command.executionId);
    expect(result.jobId).toBe(command.jobId);
    expect(result.output.hash).toMatch(/^fake-hash-/);

    expect(events).toHaveLength(2);
    const expectedStarted = makeJobExecutionStartedEvent(command);
    expect(events[0]).toEqual({ ...expectedStarted, time: expect.any(String) });
    const expectedCompleted = makeJobExecutionCompletedEvent(
      command,
      result.output,
    );
    expect(events[1]).toEqual({
      ...expectedCompleted,
      time: expect.any(String),
    });
    expect(events[1]).not.toHaveProperty("payload");
    expect(events[1]).not.toHaveProperty("body");

    expect(acquire).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledWith("grant-1");

    // The executor now receives the *resolved* request (materialized,
    // defaulted), not the raw template -- a deliberate break from Phase 1's
    // placeholder-era assertion, not a regression.
    expect(protocolExecute).toHaveBeenCalledTimes(1);
    const [requestArg] = protocolExecute.mock.calls[0]!;
    expect(requestArg).toEqual({
      url: command.protocol.url,
      method: "GET",
      headers: { Accept: "application/json" },
    });
    expect(requestArg).not.toHaveProperty("executionId");
    expect(requestArg).not.toHaveProperty("jobId");
  });

  it("expected failure: resolves (not rejects) a failed JobResult, records started+failed facts, releases the permit", async () => {
    const { sink, events } = createFakeLifecycleSink();
    const { port: permits, release } = createFakePermitPort();
    const { artifacts } = createFakeArtifactsPort();
    const protocolError = {
      code: "HTTP_STATUS_FAILED" as const,
      message: "upstream said no",
      retryable: true,
    };
    const { executor: protocol } = createFakeProtocolExecutor(() => ({
      ok: false,
      error: protocolError,
    }));
    const worker = createWorkerV2(
      { permits, lifecycle: sink, protocol, artifacts },
      GENEROUS_CONFIG,
    );
    const command = makeCommand();

    await expect(worker.execute(command)).resolves.toMatchObject({
      status: "failed",
      executionId: command.executionId,
      jobId: command.jobId,
      error: protocolError,
    });

    expect(events).toHaveLength(2);
    expect(events[0]!.kind).toBe("job-execution-started");
    const expectedFailed = makeJobExecutionFailedEvent(command, protocolError);
    expect(events[1]).toEqual({ ...expectedFailed, time: expect.any(String) });

    expect(release).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledWith("grant-1");
  });

  it("a parseable failure payload from the protocol becomes the failed result's optional output", async () => {
    const { sink } = createFakeLifecycleSink();
    const { port: permits } = createFakePermitPort();
    const { artifacts, store } = createFakeArtifactsPort();
    const { executor: protocol } = createFakeProtocolExecutor(() => ({
      ok: false,
      error: { code: "HTTP_STATUS_FAILED", message: "500", retryable: true },
      payload: { detail: "server exploded" },
    }));
    const worker = createWorkerV2(
      { permits, lifecycle: sink, protocol, artifacts },
      GENEROUS_CONFIG,
    );

    const result = await worker.execute(makeCommand());
    if (result.status !== "failed") throw new Error("expected failed");

    expect(result.output).toBeDefined();
    expect(store.get(result.output!.hash)).toEqual({
      format: "json",
      value: { detail: "server exploded" },
    });
  });

  describe("HTTP request invariants surfaced as typed failures, not thrown errors", () => {
    it("GET with a body is rejected before the protocol executor is ever called", async () => {
      const { sink, events } = createFakeLifecycleSink();
      const { port: permits } = createFakePermitPort();
      const { artifacts } = createFakeArtifactsPort();
      const { executor: protocol, execute: protocolExecute } =
        createFakeProtocolExecutor(() => ({ ok: true, payload: null }));
      const worker = createWorkerV2(
        { permits, lifecycle: sink, protocol, artifacts },
        GENEROUS_CONFIG,
      );
      const command = makeCommand({
        protocol: {
          kind: "httpjson",
          url: "https://example.test",
          method: "GET",
          body: { not: "allowed" },
        },
      });

      const result = await worker.execute(command);

      expect(result).toMatchObject({
        status: "failed",
        error: { code: "HTTP_REQUEST_INVALID", retryable: false },
      });
      expect(protocolExecute).not.toHaveBeenCalled();
      expect(events).toHaveLength(2);
      expect(events[1]!.kind).toBe("job-execution-failed");
    });

    it("a non-http(s) URL scheme is rejected before the protocol executor is ever called", async () => {
      const { sink } = createFakeLifecycleSink();
      const { port: permits } = createFakePermitPort();
      const { artifacts } = createFakeArtifactsPort();
      const { executor: protocol, execute: protocolExecute } =
        createFakeProtocolExecutor(() => ({ ok: true, payload: null }));
      const worker = createWorkerV2(
        { permits, lifecycle: sink, protocol, artifacts },
        GENEROUS_CONFIG,
      );
      const command = makeCommand({
        protocol: { kind: "httpjson", url: "file:///etc/passwd" },
      });

      const result = await worker.execute(command);

      expect(result).toMatchObject({
        status: "failed",
        error: { code: "HTTP_REQUEST_INVALID" },
      });
      expect(protocolExecute).not.toHaveBeenCalled();
    });
  });

  it("resource-key resolution failure short-circuits before any permit or protocol interaction", async () => {
    const { sink } = createFakeLifecycleSink();
    const { port: permits, acquire } = createFakePermitPort();
    const { artifacts } = createFakeArtifactsPort();
    const { executor: protocol, execute: protocolExecute } =
      createFakeProtocolExecutor(() => ({ ok: true, payload: null }));
    const resourceKeyResolver = vi.fn(() => ({
      ok: false as const,
      message: "no policy configured",
    }));
    const worker = createWorkerV2(
      { permits, lifecycle: sink, protocol, artifacts, resourceKeyResolver },
      GENEROUS_CONFIG,
    );

    const result = await worker.execute(makeCommand());

    expect(result).toMatchObject({
      status: "failed",
      error: { code: "RESOURCE_KEY_RESOLUTION_FAILED", retryable: false },
    });
    expect(acquire).not.toHaveBeenCalled();
    expect(protocolExecute).not.toHaveBeenCalled();
  });

  describe("output storage", () => {
    it("translates a primary output storage failure into a failed execution", async () => {
      const { sink, events } = createFakeLifecycleSink();
      const { port: permits } = createFakePermitPort();
      const { artifacts } = createFakeArtifactsPort();
      vi.spyOn(artifacts, "putJson").mockResolvedValueOnce({
        ok: false,
        error: { code: "STORE_PUT_FAILED", message: "disk full" },
      });
      const { executor: protocol } = createFakeProtocolExecutor(() => ({
        ok: true,
        payload: { foo: "bar" },
      }));
      const worker = createWorkerV2(
        { permits, lifecycle: sink, protocol, artifacts },
        GENEROUS_CONFIG,
      );
      const command = makeCommand();

      const result = await worker.execute(command);
      if (result.status !== "failed") {
        throw new Error(`expected failed, got ${result.status}`);
      }

      expect(result).toEqual({
        status: "failed",
        executionId: command.executionId,
        jobId: command.jobId,
        error: {
          code: "OUTPUT_STORE_FAILED",
          message: "disk full",
          retryable: false,
        },
      });
      expect(events).toHaveLength(2);
      expect(events[1]).toEqual({
        ...makeJobExecutionFailedEvent(command, result.error),
        time: expect.any(String),
      });
    });

    it("resolves, validates, and stores a text/plain export alongside the primary output", async () => {
      const { sink } = createFakeLifecycleSink();
      const { port: permits } = createFakePermitPort();
      const { artifacts, store } = createFakeArtifactsPort();
      const { executor: protocol } = createFakeProtocolExecutor(() => ({
        ok: true,
        payload: { message: "hello", count: 3 },
      }));
      const worker = createWorkerV2(
        { permits, lifecycle: sink, protocol, artifacts },
        GENEROUS_CONFIG,
      );
      const command = makeCommand({
        exports: {
          summary: {
            exportName: "summary",
            valuePath: ["output", "message"],
            scope: "output",
            string: "steps.x.exports.summary",
            type: "text/plain",
          },
        },
      });

      const result = await worker.execute(command);
      if (result.status !== "completed") {
        throw new Error(`expected completed, got ${result.status}`);
      }

      expect(result.exports?.summary).toBeDefined();
      expect(store.get(result.exports!.summary!.hash)).toEqual({
        format: "text",
        value: "hello",
      });
    });

    it("resolves, validates, and stores an application/json export with a schema", async () => {
      const { sink } = createFakeLifecycleSink();
      const { port: permits } = createFakePermitPort();
      const { artifacts, store } = createFakeArtifactsPort();
      const { executor: protocol } = createFakeProtocolExecutor(() => ({
        ok: true,
        payload: { message: "hello", count: 3 },
      }));
      const worker = createWorkerV2(
        { permits, lifecycle: sink, protocol, artifacts },
        GENEROUS_CONFIG,
      );
      const command = makeCommand({
        exports: {
          full: {
            exportName: "full",
            valuePath: ["output"],
            scope: "output",
            string: "steps.x.exports.full",
            type: "application/json",
            schema: {
              type: "object",
              required: ["message", "count"],
              properties: {
                message: { type: "string" },
                count: { type: "number" },
              },
            },
          },
        },
      });

      const result = await worker.execute(command);
      if (result.status !== "completed") {
        throw new Error(`expected completed, got ${result.status}`);
      }

      expect(store.get(result.exports!.full!.hash)).toEqual({
        format: "json",
        value: { message: "hello", count: 3 },
      });
    });

    it("a schema-invalid export fails the job while retaining the already-stored primary output", async () => {
      const { sink } = createFakeLifecycleSink();
      const { port: permits } = createFakePermitPort();
      const { artifacts } = createFakeArtifactsPort();
      const { executor: protocol } = createFakeProtocolExecutor(() => ({
        ok: true,
        payload: { message: "hello" },
      }));
      const worker = createWorkerV2(
        { permits, lifecycle: sink, protocol, artifacts },
        GENEROUS_CONFIG,
      );
      const command = makeCommand({
        exports: {
          full: {
            exportName: "full",
            valuePath: ["output"],
            scope: "output",
            string: "steps.x.exports.full",
            type: "application/json",
            schema: {
              type: "object",
              required: ["count"],
              properties: { count: { type: "number" } },
            },
          },
        },
      });

      const result = await worker.execute(command);

      expect(result).toMatchObject({
        status: "failed",
        error: { code: "EXPORT_VALIDATION_FAILED", retryable: false },
      });
      expect((result as { output?: unknown }).output).toBeDefined();
    });
  });

  it("thrown invariant failure: rejects before ever touching lifecycle or permits", async () => {
    const { sink, events } = createFakeLifecycleSink();
    const { port: permits, acquire, release } = createFakePermitPort();
    const { artifacts } = createFakeArtifactsPort();
    const { executor: protocol } = createFakeProtocolExecutor(() => ({
      ok: true,
      payload: null,
    }));
    const worker = createWorkerV2(
      { permits, lifecycle: sink, protocol, artifacts },
      GENEROUS_CONFIG,
    );
    const badCommand = makeCommand({ stepId: "" });

    await expect(worker.execute(badCommand)).rejects.toThrow();

    expect(events).toHaveLength(0);
    expect(acquire).not.toHaveBeenCalled();
    expect(release).not.toHaveBeenCalled();
  });

  it("cancellation: aborting mid-wait-for-permit resolves a failed JobResult with a distinct cancelled fact, never acquires/releases/calls the protocol", async () => {
    const { sink, events } = createFakeLifecycleSink();
    const { port: permits, acquire, release } = createControllablePermitPort();
    const { artifacts } = createFakeArtifactsPort();
    const { executor: protocol, execute: protocolExecute } =
      createFakeProtocolExecutor(() => ({ ok: true, payload: null }));
    const worker = createWorkerV2(
      { permits, lifecycle: sink, protocol, artifacts },
      GENEROUS_CONFIG,
    );
    const command = makeCommand();
    const controller = new AbortController();

    const resultPromise = worker.execute(command, {
      signal: controller.signal,
    });
    await vi.waitFor(() => expect(acquire).toHaveBeenCalled());
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
    const expectedCancelled = makeJobExecutionCancelledEvent(command);
    expect(events[1]).toEqual({
      ...expectedCancelled,
      time: expect.any(String),
    });

    expect(release).not.toHaveBeenCalled();
    expect(protocolExecute).not.toHaveBeenCalled();
  });

  it("timeout: a protocol call exceeding protocolTimeoutMs produces a distinct TIMEOUT failure, never CANCELLED", async () => {
    const { sink, events } = createFakeLifecycleSink();
    const { port: permits, release } = createFakePermitPort();
    const { artifacts } = createFakeArtifactsPort();
    // Never resolves on its own -- only the worker's own timeout signal
    // firing settles this call.
    const { executor: protocol } = createFakeProtocolExecutor(
      (_request) =>
        new Promise(() => {
          // intentionally never settles
        }),
    );
    const worker = createWorkerV2(
      { permits, lifecycle: sink, protocol, artifacts },
      { maxConcurrentJobs: 10, protocolTimeoutMs: 20 },
    );

    const result = await worker.execute(makeCommand());

    expect(result).toMatchObject({
      status: "failed",
      error: { code: "TIMEOUT", retryable: false },
    });
    expect(events).toHaveLength(2);
    expect(events[1]!.kind).toBe("job-execution-failed");
    expect(release).toHaveBeenCalledTimes(1);
  });

  it("end to end: a real HTTP JSON job (fake fetch) completes through createWorkerV2 with an export", async () => {
    const { sink, events } = createFakeLifecycleSink();
    const { port: permits } = createFakePermitPort();
    const { artifacts, store } = createFakeArtifactsPort();
    const fakeFetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ greeting: "hello world" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    const { createHttpJsonExecutor } =
      await import("../../src/v2/protocol/http-json/http-json.executor.js");
    const protocol = createHttpJsonExecutor({
      fetch: fakeFetch as unknown as typeof fetch,
    });

    const worker = createWorkerV2(
      { permits, lifecycle: sink, protocol, artifacts },
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

    const result = await worker.execute(command);

    expect(fakeFetch).toHaveBeenCalledTimes(1);
    if (result.status !== "completed") {
      throw new Error(`expected completed, got ${JSON.stringify(result)}`);
    }
    expect(store.get(result.output.hash)).toEqual({
      format: "json",
      value: { greeting: "hello world" },
    });
    expect(store.get(result.exports!.greeting!.hash)).toEqual({
      format: "text",
      value: "hello world",
    });
    expect(events.map((e) => e.kind)).toEqual([
      "job-execution-started",
      "job-execution-completed",
    ]);
  });

  describe("guaranteed permit release", () => {
    it("does not release or invoke the protocol when permit acquisition fails", async () => {
      const { sink, events } = createFakeLifecycleSink();
      const { port: permits, acquire, release } = createFakePermitPort();
      const { artifacts } = createFakeArtifactsPort();
      const { executor: protocol, execute: protocolExecute } =
        createFakeProtocolExecutor(() => ({ ok: true, payload: null }));
      const thrown = new Error("permit unavailable");
      acquire.mockRejectedValueOnce(thrown);
      const worker = createWorkerV2(
        { permits, lifecycle: sink, protocol, artifacts },
        GENEROUS_CONFIG,
      );

      await expect(worker.execute(makeCommand())).rejects.toBe(thrown);

      expect(release).not.toHaveBeenCalled();
      expect(protocolExecute).not.toHaveBeenCalled();
      expect(events).toHaveLength(1);
      expect(events[0]!.kind).toBe("job-execution-started");
    });

    it("releases on success", async () => {
      const { sink } = createFakeLifecycleSink();
      const { port: permits, release } = createFakePermitPort();
      const { artifacts } = createFakeArtifactsPort();
      const { executor: protocol } = createFakeProtocolExecutor(() => ({
        ok: true,
        payload: null,
      }));
      const worker = createWorkerV2(
        { permits, lifecycle: sink, protocol, artifacts },
        GENEROUS_CONFIG,
      );

      await worker.execute(makeCommand());

      expect(release).toHaveBeenCalledTimes(1);
      expect(release).toHaveBeenCalledWith("grant-1");
    });

    it("releases on an expected (resolved) protocol failure", async () => {
      const { sink } = createFakeLifecycleSink();
      const { port: permits, release } = createFakePermitPort();
      const { artifacts } = createFakeArtifactsPort();
      const { executor: protocol } = createFakeProtocolExecutor(() => ({
        ok: false,
        error: { code: "HTTP_STATUS_FAILED", message: "x", retryable: false },
      }));
      const worker = createWorkerV2(
        { permits, lifecycle: sink, protocol, artifacts },
        GENEROUS_CONFIG,
      );

      await worker.execute(makeCommand());

      expect(release).toHaveBeenCalledTimes(1);
      expect(release).toHaveBeenCalledWith("grant-1");
    });

    it("releases even when the protocol executor throws, and re-throws without recording a completion/failure/cancellation fact", async () => {
      const { sink, events } = createFakeLifecycleSink();
      const { port: permits, release } = createFakePermitPort();
      const { artifacts } = createFakeArtifactsPort();
      const thrown = new Error("boom");
      const { executor: protocol } = createFakeProtocolExecutor(() => {
        throw thrown;
      });
      const worker = createWorkerV2(
        { permits, lifecycle: sink, protocol, artifacts },
        GENEROUS_CONFIG,
      );
      const command = makeCommand();

      await expect(worker.execute(command)).rejects.toThrow(thrown);

      expect(release).toHaveBeenCalledTimes(1);
      expect(release).toHaveBeenCalledWith("grant-1");
      expect(events).toHaveLength(1);
      expect(events[0]!.kind).toBe("job-execution-started");
    });
  });
});

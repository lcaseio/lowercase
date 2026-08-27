import { describe, expect, it, vi } from "vitest";
import { createWorkerV2 } from "../../src/v2/worker.js";
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

describe("WorkerV2", () => {
  it("success: completes, stores output, records started+completed facts, releases the permit", async () => {
    const { sink, events } = createFakeLifecycleSink();
    const { port: permits, acquire, release } = createFakePermitPort();
    const { artifacts } = createFakeArtifactsPort();
    const { executor: protocol, execute: protocolExecute } =
      createFakeProtocolExecutor(() => ({ ok: true, payload: { foo: "bar" } }));
    const worker = createWorkerV2({
      permits,
      lifecycle: sink,
      protocol,
      artifacts,
    });
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

    expect(protocolExecute).toHaveBeenCalledTimes(1);
    const [requestArg] = protocolExecute.mock.calls[0]!;
    expect(requestArg).toEqual(command.protocol);
    expect(requestArg).not.toHaveProperty("executionId");
    expect(requestArg).not.toHaveProperty("jobId");
  });

  it("expected failure: resolves (not rejects) a failed JobResult, records started+failed facts, releases the permit", async () => {
    const { sink, events } = createFakeLifecycleSink();
    const { port: permits, release } = createFakePermitPort();
    const { artifacts } = createFakeArtifactsPort();
    const protocolError = {
      code: "UPSTREAM_ERROR",
      message: "upstream said no",
      retryable: true,
    };
    const { executor: protocol } = createFakeProtocolExecutor(() => ({
      ok: false,
      error: protocolError,
    }));
    const worker = createWorkerV2({
      permits,
      lifecycle: sink,
      protocol,
      artifacts,
    });
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
      const worker = createWorkerV2({
        permits,
        lifecycle: sink,
        protocol,
        artifacts,
      });
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

    it("retains the stored primary output when Phase 1 rejects declared exports", async () => {
      const { sink, events } = createFakeLifecycleSink();
      const { port: permits } = createFakePermitPort();
      const { artifacts } = createFakeArtifactsPort();
      const putJson = vi.spyOn(artifacts, "putJson");
      const { executor: protocol } = createFakeProtocolExecutor(() => ({
        ok: true,
        payload: { foo: "bar" },
      }));
      const worker = createWorkerV2({
        permits,
        lifecycle: sink,
        protocol,
        artifacts,
      });
      const command = makeCommand({
        exports: { summary: { hash: "phase-2-placeholder" } },
      });

      const result = await worker.execute(command);
      if (result.status !== "failed") {
        throw new Error(`expected failed, got ${result.status}`);
      }

      expect(result).toEqual({
        status: "failed",
        executionId: command.executionId,
        jobId: command.jobId,
        error: {
          code: "EXPORT_VALIDATION_FAILED",
          message: "Export storage is not implemented in Worker V2 Phase 1",
          retryable: false,
        },
        output: { hash: "fake-hash-1" },
      });
      expect(putJson).toHaveBeenCalledTimes(1);
      expect(events).toHaveLength(2);
      expect(events[1]).toEqual({
        ...makeJobExecutionFailedEvent(command, result.error),
        time: expect.any(String),
      });
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
    const worker = createWorkerV2({
      permits,
      lifecycle: sink,
      protocol,
      artifacts,
    });
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
    const worker = createWorkerV2({
      permits,
      lifecycle: sink,
      protocol,
      artifacts,
    });
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

  describe("guaranteed permit release", () => {
    it("does not release or invoke the protocol when permit acquisition fails", async () => {
      const { sink, events } = createFakeLifecycleSink();
      const { port: permits, acquire, release } = createFakePermitPort();
      const { artifacts } = createFakeArtifactsPort();
      const { executor: protocol, execute: protocolExecute } =
        createFakeProtocolExecutor(() => ({ ok: true, payload: null }));
      const thrown = new Error("permit unavailable");
      acquire.mockRejectedValueOnce(thrown);
      const worker = createWorkerV2({
        permits,
        lifecycle: sink,
        protocol,
        artifacts,
      });

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
      const worker = createWorkerV2({
        permits,
        lifecycle: sink,
        protocol,
        artifacts,
      });

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
        error: { code: "X", message: "x", retryable: false },
      }));
      const worker = createWorkerV2({
        permits,
        lifecycle: sink,
        protocol,
        artifacts,
      });

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
      const worker = createWorkerV2({
        permits,
        lifecycle: sink,
        protocol,
        artifacts,
      });
      const command = makeCommand();

      await expect(worker.execute(command)).rejects.toThrow(thrown);

      expect(release).toHaveBeenCalledTimes(1);
      expect(release).toHaveBeenCalledWith("grant-1");
      expect(events).toHaveLength(1);
      expect(events[0]!.kind).toBe("job-execution-started");
    });
  });
});

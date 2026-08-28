import { describe, expect, it, vi } from "vitest";
import { createLegacyHttpJsonQueueConsumer } from "../../src/v2/adapters/inbound/legacy-httpjson-queue-consumer.adapter.js";
import type { JobExecutionPort } from "../../src/v2/ports/inbound/job-execution.port.js";
import type { JobResult } from "../../src/v2/job.contracts.js";
import { createFakeBus } from "./helpers/fake-bus.js";
import { createFakeQueue } from "./helpers/fake-queue.js";
import { makeQueuedEvent } from "./helpers/fixtures.js";

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function fakeWorker(executeFn: JobExecutionPort["execute"]): JobExecutionPort {
  return { execute: executeFn };
}

// Generously conservative: settles reserve -> execute -> emit -> loop chains
// that cross several real microtask ticks, with no reliance on fake timers.
async function flushMicrotasks(times = 25): Promise<void> {
  for (let i = 0; i < times; i++) await Promise.resolve();
}

describe("createLegacyHttpJsonQueueConsumer", () => {
  it("bounds intake to maxInFlightJobs: preloaded jobs beyond the bound stay queued until one completes", async () => {
    const { queue, depth } = createFakeQueue();
    const { bus } = createFakeBus();

    for (let i = 0; i < 10; i++) {
      await queue.enqueue(
        "httpjson",
        makeQueuedEvent({ url: `https://example.test/${i}` }),
      );
    }

    const gates = Array.from({ length: 10 }, () => createDeferred<JobResult>());
    let calls = 0;
    const worker = fakeWorker(async () => {
      const gate = gates[calls];
      calls += 1;
      return gate.promise;
    });

    const consumer = createLegacyHttpJsonQueueConsumer(
      { queue, bus, worker },
      { workerId: "worker-1", maxInFlightJobs: 3 },
    );

    await consumer.start();
    await flushMicrotasks();

    expect(calls).toBe(3);
    expect(depth("httpjson")).toBe(7);

    gates[0].resolve({
      status: "completed",
      executionId: "e",
      jobId: "e",
      output: { hash: "h" },
    });
    await flushMicrotasks();

    expect(calls).toBe(4);
    expect(depth("httpjson")).toBe(6);

    // stopAllJobWaiters() waits for every in-flight job to finish (verified
    // separately below) -- resolve the ones still outstanding (indices
    // 1..calls-1; index 0 already resolved above) before awaiting it, or the
    // await would hang on gates this test never intends to settle.
    for (let i = 1; i < calls; i++) {
      gates[i].resolve({
        status: "completed",
        executionId: "e",
        jobId: "e",
        output: { hash: "h" },
      });
    }
    await consumer.stopAllJobWaiters();
  });

  it("publishes job.httpjson.completed with mapped data on a successful job", async () => {
    const { queue } = createFakeQueue();
    const { bus, published } = createFakeBus();
    const event = makeQueuedEvent({ url: "https://example.test/ok" });
    await queue.enqueue("httpjson", event);

    const worker = fakeWorker(async () => ({
      status: "completed",
      executionId: event.jobid,
      jobId: event.jobid,
      output: { hash: "output-hash" },
      exports: { thing: { hash: "thing-hash" } },
    }));

    const consumer = createLegacyHttpJsonQueueConsumer(
      { queue, bus, worker },
      { workerId: "worker-1", maxInFlightJobs: 1 },
    );
    await consumer.start();
    await flushMicrotasks();
    await consumer.stopAllJobWaiters();

    expect(published).toHaveLength(1);
    expect(published[0]).toMatchObject({
      type: "job.httpjson.completed",
      runid: event.runid,
      stepid: event.stepid,
      jobid: event.jobid,
      data: {
        status: "success",
        output: "output-hash",
        exportHashes: { thing: "thing-hash" },
      },
    });
  });

  it("publishes job.httpjson.failed with mapped data on a failed job", async () => {
    const { queue } = createFakeQueue();
    const { bus, published } = createFakeBus();
    const event = makeQueuedEvent({ url: "https://example.test/fail" });
    await queue.enqueue("httpjson", event);

    const worker = fakeWorker(async () => ({
      status: "failed",
      executionId: event.jobid,
      jobId: event.jobid,
      error: {
        code: "HTTP_STATUS_FAILED",
        message: "HTTP 500",
        retryable: true,
      },
    }));

    const consumer = createLegacyHttpJsonQueueConsumer(
      { queue, bus, worker },
      { workerId: "worker-1", maxInFlightJobs: 1 },
    );
    await consumer.start();
    await flushMicrotasks();
    await consumer.stopAllJobWaiters();

    expect(published).toHaveLength(1);
    expect(published[0]).toMatchObject({
      type: "job.httpjson.failed",
      data: { status: "failure", output: null, message: "HTTP 500" },
    });
  });

  it("stop() unblocks a lane currently parked in reserve() with no queued work", async () => {
    const { queue } = createFakeQueue();
    const { bus } = createFakeBus();
    const worker = fakeWorker(
      vi.fn(async () => {
        throw new Error("should not be called: nothing was queued");
      }),
    );

    const consumer = createLegacyHttpJsonQueueConsumer(
      { queue, bus, worker },
      { workerId: "worker-1", maxInFlightJobs: 2 },
    );
    await consumer.start();
    await flushMicrotasks();

    await expect(consumer.stop()).resolves.toBeUndefined();
    expect(worker.execute).not.toHaveBeenCalled();
  });

  it("stop() waits for an in-flight job to finish rather than aborting it", async () => {
    const { queue } = createFakeQueue();
    const { bus, published } = createFakeBus();
    const event = makeQueuedEvent();
    await queue.enqueue("httpjson", event);

    const gate = createDeferred<JobResult>();
    const worker = fakeWorker(async () => gate.promise);

    const consumer = createLegacyHttpJsonQueueConsumer(
      { queue, bus, worker },
      { workerId: "worker-1", maxInFlightJobs: 1 },
    );
    await consumer.start();
    await flushMicrotasks();

    let stopped = false;
    const stopPromise = consumer.stop().then(() => {
      stopped = true;
    });

    await flushMicrotasks();
    expect(stopped).toBe(false); // still draining the in-flight job

    gate.resolve({
      status: "completed",
      executionId: event.jobid,
      jobId: event.jobid,
      output: { hash: "h" },
    });
    await stopPromise;

    expect(stopped).toBe(true);
    expect(published).toHaveLength(1); // the in-flight job completed, not aborted
  });
});

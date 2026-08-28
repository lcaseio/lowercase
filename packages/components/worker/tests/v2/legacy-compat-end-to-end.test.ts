import { describe, expect, it } from "vitest";
import type { JobCompletedData } from "@lcase/types";
import { createLegacyHttpJsonQueueConsumer } from "../../src/v2/adapters/inbound/legacy-httpjson-queue-consumer.adapter.js";
import { createWorkerV2 } from "../../src/v2/worker.js";
import { createLocalResourcePermitPort } from "../../src/v2/adapters/outbound/local-resource-permit.adapter.js";
import { createHttpJsonExecutor } from "../../src/v2/protocol/http-json/http-json.executor.js";
import { createFakeArtifactsPort } from "./helpers/fake-artifacts.js";
import { createFakeBus } from "./helpers/fake-bus.js";
import { createFakeFetch, jsonResponse } from "./helpers/fake-fetch.js";
import { createFakeLifecycleSink } from "./helpers/fake-lifecycle-sink.js";
import { createFakeQueue } from "./helpers/fake-queue.js";
import { makeQueuedEvent } from "./helpers/fixtures.js";

async function flushMicrotasks(times = 25): Promise<void> {
  for (let i = 0; i < times; i++) await Promise.resolve();
}

describe("legacy compatibility adapter, end to end", () => {
  it("a real queued httpjson event flows through Worker V2 and produces a correctly-shaped job.httpjson.completed event", async () => {
    const { queue } = createFakeQueue();
    const { bus, published } = createFakeBus();
    const { artifacts } = createFakeArtifactsPort();
    const { sink: lifecycle, events: lifecycleEvents } =
      createFakeLifecycleSink();
    const { fetch } = createFakeFetch(async () =>
      jsonResponse(200, { hello: "world" }),
    );

    const event = makeQueuedEvent({
      url: "https://example.test/resource",
      method: "GET",
    });
    await queue.enqueue("httpjson", event);

    const worker = createWorkerV2(
      {
        permits: createLocalResourcePermitPort({ maxConcurrencyPerKey: 1 }),
        lifecycle,
        protocol: createHttpJsonExecutor({ fetch }),
        artifacts,
      },
      { maxConcurrentJobs: 1, protocolTimeoutMs: 5_000 },
    );

    const consumer = createLegacyHttpJsonQueueConsumer(
      { queue, bus, worker },
      { workerId: "worker-1", maxInFlightJobs: 1 },
    );

    await consumer.start();
    await flushMicrotasks();
    await consumer.stopAllJobWaiters();

    expect(published).toHaveLength(1);
    const [completedEvent] = published;
    expect(completedEvent).toMatchObject({
      type: "job.httpjson.completed",
      runid: event.runid,
      stepid: event.stepid,
      jobid: event.jobid,
      data: { status: "success" },
    });
    if (completedEvent.type !== "job.httpjson.completed") {
      throw new Error("expected a job.httpjson.completed event");
    }
    // AnyEvent (no type arg) doesn't correlate `type` with `data`'s shape for
    // TS narrowing -- correct by construction given the check above, same
    // category of correlated-generic-indexed-access cast already accepted
    // elsewhere in this codebase (see fake-artifacts.ts).
    const data = completedEvent.data as JobCompletedData;
    expect(typeof data.output).toBe("string");

    expect(lifecycleEvents.map((e) => e.kind)).toEqual([
      "job-execution-started",
      "job-execution-completed",
    ]);
  });
});

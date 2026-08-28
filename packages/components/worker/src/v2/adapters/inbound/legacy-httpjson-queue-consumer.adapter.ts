import { emit } from "@lcase/events";
import type { EventBusPort, QueuePort, WorkerPort } from "@lcase/ports";
import type { AnyEvent } from "@lcase/types";
import type { JobExecutionPort } from "../../ports/inbound/job-execution.port.js";
import {
  toCompatibilityCompletedData,
  toCompatibilityFailedData,
  toEmitOptions,
  toExecuteJobCommand,
} from "./legacy-httpjson-job.mapper.js";

// Worker V2 supports exactly one protocol today (httpjson), and the engine's
// planner hardcodes `toolid: "httpjson"` regardless of a step's own `tool`
// field -- there is only one real queue lane to consume from currently.
const QUEUE_NAME = "httpjson";

export type LegacyHttpJsonQueueConsumerDeps = {
  queue: QueuePort;
  bus: EventBusPort;
  worker: JobExecutionPort;
};

export type LegacyHttpJsonQueueConsumerConfig = {
  workerId: string;
  // Bounds how many events may leave the queue at once -- deliberately
  // independent of Worker V2's own maxConcurrentJobs (see
  // withWorkerCapacity), even though today's composition sets them equal.
  // Reserving unboundedly and letting Worker V2's internal capacity
  // semaphore queue the rest would turn that semaphore into a second,
  // non-durable, uninspectable queue.
  maxInFlightJobs: number;
};

// The one file under v2/adapters/ allowed to know the old queue contract,
// event envelope, and component-lifecycle port (WorkerPort) -- everything
// else in v2/ stays free of this legacy vocabulary.
export function createLegacyHttpJsonQueueConsumer(
  deps: LegacyHttpJsonQueueConsumerDeps,
  config: LegacyHttpJsonQueueConsumerConfig,
): WorkerPort {
  let stopped = true;
  let lanes: Promise<void>[] = [];

  async function handleQueuedEvent(
    event: AnyEvent<"job.httpjson.queued">,
  ): Promise<void> {
    const command = toExecuteJobCommand(event);
    const result = await deps.worker.execute(command);
    const source = `lowercase://worker/${config.workerId}`;
    const options = toEmitOptions(event, source);

    if (result.status === "completed") {
      await emit(
        deps.bus,
        "job.httpjson.completed",
        toCompatibilityCompletedData(result),
        options,
      );
    } else {
      await emit(
        deps.bus,
        "job.httpjson.failed",
        toCompatibilityFailedData(result),
        options,
      );
    }
  }

  async function runLane(): Promise<void> {
    while (!stopped) {
      const event = await deps.queue.reserve(QUEUE_NAME, config.workerId);
      // A falsy resolution means shutdown resolved this reservation early
      // (queue.abortAllForWorker) -- loop back to re-check `stopped` rather
      // than treating it as a real job.
      if (!event) continue;
      // Safe by construction: this lane only ever reserves from the
      // "httpjson" queue, which only ever holds job.httpjson.queued events.
      await handleQueuedEvent(event as AnyEvent<"job.httpjson.queued">);
    }
  }

  async function drain(): Promise<void> {
    stopped = true;
    deps.queue.abortAllForWorker(config.workerId);
    await Promise.all(lanes);
  }

  return {
    async start() {
      stopped = false;
      lanes = Array.from({ length: config.maxInFlightJobs }, () => runLane());
    },
    stop: drain,
    // No meaningful distinction from stop() for this adapter -- old worker's
    // split (bus-subscription teardown vs. job-waiter teardown) doesn't
    // apply here, since this adapter has no bus subscription for intake.
    stopAllJobWaiters: drain,
  };
}

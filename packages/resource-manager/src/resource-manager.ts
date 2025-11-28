import type { EventBusPort } from "@lcase/ports/bus";
import type {
  EmitterFactoryPort,
  JobCompletedParsed,
  JobFailedParsed,
  JobParserPort,
  JobSubmittedParsed,
} from "@lcase/ports/events";
import type { ResourceManagerPort } from "../../ports/dist/rm/resource-manager.port.js";
import type { QueuePort } from "@lcase/ports";
import type {
  AnyEvent,
  InternalToolsMap,
  JobDelayedType,
  JobEvent,
  JobEventType,
  JobQueuedType,
  JobSubmittedEvent,
  ToolId,
} from "@lcase/types";
import { internalToolConfig } from "./internal-tools.map.js";
import { CapId } from "../../types/dist/flow/map.js";
import { defaultCapToolMap } from "./default-tools.map.js";

export type ResourceManagerDeps = {
  bus: EventBusPort;
  ef: EmitterFactoryPort;
  queue: QueuePort;
  jobParser: JobParserPort;
};

export type CapRegisteredToolsMap = {
  [T in CapId]?: Set<string>;
};

export type JobParsedAny =
  | JobSubmittedParsed
  | JobCompletedParsed
  | JobFailedParsed;

/**
 * this resource manager is designed to map step capabilities to
 * tools based on policies / table lookups, queue them if the worker
 * concurrency / availability is ready, or place them in a delayed queue
 * until thresholds for queueing the job are met.
 *
 * currently this class does not implement all this functionality.
 *
 * still left to implement:
 * - worker availability
 * - policy based tool decisions
 * - capability maps to toolscy
 */
export class ResourceManager implements ResourceManagerPort {
  static contact = true;
  #bus: EventBusPort;
  #ef: EmitterFactoryPort;
  #queue: QueuePort;
  #jobParser: JobParserPort;
  #internalTools: InternalToolsMap;
  #availableTools = new Set<ToolId>();
  #capRegisteredToolsMap: CapRegisteredToolsMap = {};
  #capDefaultToolMap: Record<CapId, string>;
  #activeTools = new Map<ToolId, number>();
  busStopTopics = new Map<string, () => void>();
  constructor(deps: ResourceManagerDeps) {
    this.#bus = deps.bus;
    this.#ef = deps.ef;
    this.#queue = deps.queue;
    this.#jobParser = deps.jobParser;
    this.#internalTools = internalToolConfig;
    this.#capDefaultToolMap = defaultCapToolMap;
    this.mapInternalTools();
  }
  mapInternalTools() {
    for (const toolId in this.#internalTools) {
      const caps = this.#internalTools[toolId].capabilities;
      for (const cap of caps) {
        if (this.#capRegisteredToolsMap[cap] === undefined) {
          this.#capRegisteredToolsMap[cap] = new Set<string>();
        }
        this.#capRegisteredToolsMap[cap].add(toolId);
      }
    }
  }

  start() {
    const worker = "worker.registration.requested";
    const submitted = "job.*.submitted";
    const completed = "job.*.completed";
    const failed = "job.*.failed";

    this.busStopTopics.set(
      worker,
      this.#bus.subscribe(
        worker,
        async (event) => await this.handleWorkerRequest(event)
      )
    );
    this.busStopTopics.set(
      submitted,
      this.#bus.subscribe(
        submitted,
        async (event) => await this.handleSubmitted(event)
      )
    );
    this.busStopTopics.set(
      completed,
      this.#bus.subscribe(completed, async (event) =>
        this.handleCompletedOrFailed(event)
      )
    );
    this.busStopTopics.set(
      failed,
      this.#bus.subscribe(failed, async (event) =>
        this.handleCompletedOrFailed(event)
      )
    );
  }
  stop() {
    for (const [_topic, cb] of this.busStopTopics.entries()) {
      cb();
    }
  }

  async handleWorkerRequest(event: AnyEvent) {
    if (event.type === "worker.registration.requested") {
      const e = event as AnyEvent<"worker.registration.requested">;
      this.registerWorkerTools(e);
    }
  }

  async handleCompletedOrFailed(event: AnyEvent) {
    let job;
    if (event.type.endsWith(".completed")) {
      job = this.#jobParser.parseJobCompleted(event);
    } else if (event.type.endsWith(".failed")) {
      job = this.#jobParser.parseJobFailed(event);
    }

    if (await this.jobHasErrors(event, job)) return;
    const active = Math.max(0, this.#activeTools.get(event.type) ?? 0 - 1);
    this.#activeTools.set(event.type, active);
  }

  async handleSubmitted(event: AnyEvent): Promise<void> {
    const job = this.#jobParser.parseJobSubmitted(event);
    if (await this.jobHasErrors(event, job)) return;
    const e = job!.event;

    const tool = this.resolveToolPolicy(e);
    if (!tool) {
      this.emitError(event, "Could not resolve tool");
      return;
    }
    e.data.job.toolid = tool;
    e.toolid = tool;

    await this.queueOrDelaySubmitted(e);
    return;
  }
  async jobHasErrors<T extends JobParsedAny>(
    event: AnyEvent,
    job: T | undefined
  ): Promise<boolean> {
    if (!job) {
      await this.emitError(event, "Error parsing job.", job);
      return true;
    }
    if (job.capId in this.#capRegisteredToolsMap === false) {
      await this.emitError(
        event,
        "No tools registered to handle capability id: }",
        job
      );
      return true;
    }
    return false;
  }
  async emitError(
    event: AnyEvent,
    message: string,
    data?: unknown
  ): Promise<void> {
    await this.#ef
      .newSystemEmitterNewSpan(
        {
          source: "lowercase://rm/job-has-errors",
        },
        event.traceid
      )
      .emit("system.logged", {
        log: message,
        payload: data,
      });
  }

  resolveToolPolicy(event: JobEvent<JobEventType>): string | undefined {
    if (event.data.job.toolid) return event.data.job.toolid;

    // NOTE: future policy based tool resolvers or more complex mapping

    const tool = this.getDefaultTool(event.data.job.capid);
    if (!tool) {
      this.emitError(
        event,
        `No default tool for capability: ${event.data.job.capid}`,
        event
      );
      return;
    }
    return tool;
  }

  getDefaultTool(capId: CapId): string | undefined {
    const tool = this.#capDefaultToolMap[capId];
    return tool;
  }

  async queueOrDelaySubmitted(e: JobSubmittedEvent) {
    const toolId = e.data.job.toolid!;
    const capId = e.data.job.capid;
    const max = this.#internalTools[toolId].maxConcurrency;
    let current = this.#activeTools.get(toolId) ?? 0;

    const jobEmitter = this.#ef.newJobEmitterFromEvent(
      e,
      "lowercase://rm/queue-or-delay-submitted"
    );
    if (current < max) {
      const type = `job.${capId}.queued` as JobQueuedType;
      const newEvent = await jobEmitter.emit(type, e.data);
      this.#queue.enqueue(toolId, newEvent);
      this.#activeTools.set(toolId, ++current);
    } else {
      const type = `job.${capId}.delayed` as JobDelayedType;
      const newEvent = await jobEmitter.emit(type, e.data);
      this.#queue.enqueue(`${toolId}.delayed`, newEvent);
    }
  }

  async registerWorkerTools(event: AnyEvent<"worker.registration.requested">) {
    for (const tool of event.data.tools) {
      this.#availableTools.add(tool);
    }

    const we = this.#ef.newWorkerEmitterNewSpan(
      {
        source: "lowercase://rm/register-worker-tools",
        workerid: event.data.worker.id,
      },
      event.traceid
    );
    await we.emit("worker.registered", {
      worker: {
        id: event.data.worker.id,
      },
      workerId: event.data.worker.id,
      status: "accepted",
      registeredAt: new Date().toISOString(),
    });
  }
}

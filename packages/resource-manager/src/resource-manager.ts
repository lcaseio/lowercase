import type { EventBusPort } from "@lcase/ports/bus";
import type { EmitterFactoryPort } from "@lcase/ports/events";
import type { ResourceManagerPort } from "@lcase/ports/resource-manager";
import type { QueuePort } from "@lcase/ports";
import type { AnyEvent, ToolId } from "@lcase/types";
import { internalToolConfig } from "./internal-tools.map.js";

export type ResourceManagerDeps = {
  bus: EventBusPort;
  ef: EmitterFactoryPort;
  queue: QueuePort;
};
/**
 * this resource manager is designed to map step capabilities to
 * tools based on policies / table lookups, queue them if the worker
 * concurrency / availability is ready, or place them in a waiting queue
 * until thresholds for queueing the job are met.
 *
 * currently this class does not implement all this functionality.
 *
 * still left to implement:
 * - tool resolution
 * - generic queue logic
 * - worker availability
 * - policy based tool decisions
 * - capability maps to tools
 * - respond to job completed/failed to decrement system concurrency
 *
 * This current version wires up in the runtime and works, but needs
 * further generalization.
 */
export class ResourceManager implements ResourceManagerPort {
  #bus: EventBusPort;
  #ef: EmitterFactoryPort;
  #queue: QueuePort;
  #internalTools = internalToolConfig;
  #availableTools = new Set<ToolId>();
  #activeTools = new Map<ToolId, number>();
  constructor(deps: ResourceManagerDeps) {
    this.#bus = deps.bus;
    this.#ef = deps.ef;
    this.#queue = deps.queue;
  }

  start() {
    this.#bus.subscribe(
      "worker.registration.requested",
      async (event) => await this.handleRequest(event)
    );
    this.#bus.subscribe(
      "job.*.submitted",
      async (event) => await this.handleRequest(event)
    );
  }
  stop() {
    this.#bus.close();
  }

  async handleRequest(event: AnyEvent) {
    if (event.type === "worker.registration.requested") {
      const e = event as AnyEvent<"worker.registration.requested">;
      this.registerWorkerTools(e);
    }
    if (event.type === "job.httpjson.submitted") {
      const e = event as AnyEvent<"job.httpjson.submitted">;
      await this.queueHttpJsonJob(e);
    }
    if (event.type === "job.mcp.submitted") {
      const e = event as AnyEvent<"job.mcp.submitted">;
      console.log("[rm] got job.httpjson.submitted");
      await this.queueMcpJob(e);
    }
  }

  async queueHttpJsonJob(event: AnyEvent<"job.httpjson.submitted">) {
    const toolId = event.data.job.toolid as ToolId;

    if (!this.isAvailable(event.data.job.toolid as ToolId)) {
      console.log("[rm] tool can't be queued:", event);
      const logEmitter = this.#ef.newSystemEmitterNewSpan(
        {
          source: "lowercase://rm/queue-job/not-available",
        },
        event.traceid
      );
      await logEmitter.emit("system.logged", {
        log: "[rm] tool can't be queued",
        payload: event,
      });
      return;
    }
    let active = this.#activeTools.get(toolId) ?? 0;
    this.#activeTools.set(toolId, ++active);

    const jobEmitter = this.#ef.newJobEmitterFromEvent(
      event,
      "lowercase://rm/queue-job"
    );

    const jobQueued = await jobEmitter.emit("job.httpjson.queued", event.data);

    this.#queue.enqueue(toolId, jobQueued);
  }

  async queueMcpJob(event: AnyEvent<"job.mcp.submitted">) {
    const toolId = event.data.job.toolid as ToolId;

    if (!this.isAvailable(event.data.job.toolid as ToolId)) {
      console.log("[rm] tool can't be queued:", event);
      const logEmitter = this.#ef.newSystemEmitterNewSpan(
        {
          source: "lowercase://rm/queue-job/not-available",
        },
        event.traceid
      );
      await logEmitter.emit("system.logged", {
        log: "[rm] tool can't be queued",
        payload: event,
      });
      return;
    }
    let active = this.#activeTools.get(toolId) ?? 0;
    this.#activeTools.set(toolId, ++active);

    const jobEmitter = this.#ef.newJobEmitterFromEvent(
      event,
      "lowercase://rm/queue-job"
    );

    const jobQueued = await jobEmitter.emit("job.mcp.queued", event.data);

    this.#queue.enqueue(toolId, jobQueued);
  }

  isAvailable(toolId: ToolId): boolean {
    if (!this.#availableTools.has(toolId)) return false;
    const active = this.#activeTools.get(toolId);

    if (active && active >= this.#internalTools[toolId].maxConcurrency) {
      return false;
    }

    return true;
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

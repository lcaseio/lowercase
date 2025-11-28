import type { EventBusPort } from "@lcase/ports/bus";
import type {
  EmitterFactoryPort,
  EventParserPort,
  JobParserPort,
} from "@lcase/ports/events";
import type { ResourceManagerPort } from "../../ports/dist/rm/resource-manager.port.js";
import type { QueuePort } from "@lcase/ports";
import type {
  AnyEvent,
  InternalToolsMap,
  JobSubmittedType,
  ToolId,
} from "@lcase/types";
import { internalToolConfig } from "./internal-tools.map.js";
import { CapId } from "../../types/dist/flow/map.js";

export type ResourceManagerDeps = {
  bus: EventBusPort;
  ef: EmitterFactoryPort;
  queue: QueuePort;
  parser: EventParserPort;
  jobParser: JobParserPort;
};

export type CapToolMap = {
  [T in CapId]?: Set<string>;
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
 *
 *
 *
 * responsibilities
 *
 * - get .submitted, .completed/failed/finished events
 *
 * - resolve tool based on policy
 * - see if available
 */
export class ResourceManager implements ResourceManagerPort {
  static contact = true;
  #bus: EventBusPort;
  #ef: EmitterFactoryPort;
  #queue: QueuePort;
  #parser: EventParserPort;
  #jobParser: JobParserPort;
  #internalTools: InternalToolsMap;
  #availableTools = new Set<ToolId>();
  #capMap: CapToolMap = {};
  #activeTools = new Map<ToolId, number>();
  constructor(deps: ResourceManagerDeps) {
    this.#bus = deps.bus;
    this.#ef = deps.ef;
    this.#queue = deps.queue;
    this.#parser = deps.parser;
    this.#jobParser = deps.jobParser;
    this.#internalTools = internalToolConfig;
    this.mapInternalTools();
  }
  mapInternalTools() {
    for (const toolId in this.#internalTools) {
      const caps = this.#internalTools[toolId].capabilities;
      for (const cap of caps) {
        if (this.#capMap[cap] === undefined) {
          this.#capMap[cap] = new Set<string>();
        }
        this.#capMap[cap].add(toolId);
      }
    }
  }

  start() {
    this.#bus.subscribe(
      "worker.registration.requested",
      async (event) => await this.handleRequest(event)
    );
    this.#bus.subscribe(
      "job.*.submitted",
      async (event) => await this.handleGeneric(event)
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
  }

  async handleGeneric(event: AnyEvent) {
    const job = this.#jobParser.parseJobSubmitted(event);
    if (!job) {
      throw new Error("[rm] must have correct event type");
    }
    if (job.capId in this.#capMap === false) {
      throw new Error("[rm] must get a known cap");
    }

    const e = job.event;
    // const e = this.#parser.parse(event, event.type) as JobSubmittedEvent;

    let toolId = e.data.job.toolid ?? "";
    console.log("toolId:", toolId);

    const max = this.#internalTools[toolId].maxConcurrency;
    let current = this.#activeTools.get(toolId) ?? 0;

    e.toolid = toolId;
    e.data.job.toolid = toolId;
    const jobEmitter = this.#ef.newJobEmitterFromEvent(
      e,
      "rm://handle-generic"
    );

    if (current < max) {
      const type = `job.${job.capId}.queued`;
      e.type = type as JobSubmittedType;
      const newEvent = await jobEmitter.emit(e.type, e.data);
      this.#queue.enqueue(toolId, newEvent);
      this.#activeTools.set(toolId, ++current);
    } else {
      const type = `job.${job.capId}.throttled`;
      e.type = type as JobSubmittedType;
      const newEvent = await jobEmitter.emit(e.type, e.data);
    }
  }

  resolveTool(capId: CapId): string {
    if (this.#capMap[capId] === undefined) {
      throw new Error(`[rm] no tool available for cap: ${capId}`);
    }
    const toolSet = this.#capMap[capId];
    for (const [tool] of toolSet.entries()) {
      const max = this.#internalTools[tool].maxConcurrency;
      const current = this.#activeTools.get(tool);
      if (current && current < max) {
        return tool;
      }
    }
    throw new Error("[rm] no tool found with capacity");
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

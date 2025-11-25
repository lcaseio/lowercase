import type {
  EventBusPort,
  QueuePort,
  StreamRegistryPort,
  ToolPort,
} from "@lcase/ports";
import { EmitterFactory } from "@lcase/events";
import type {
  AllJobEvents,
  AnyEvent,
  Capability,
  JobEventType,
  WorkerMetadata,
  ToolId,
  ToolInstance,
} from "@lcase/types";
import { ToolRegistry } from "@lcase/tools";
import type { JobContext, JobDescriptor } from "./types.js";
import { JobExecutor } from "./executor/job-executor.js";
import { interpretJob } from "./interpreter/interpret-job.js";

export type WorkerCapability = Capability & {
  newJobWaitersAreAllowed: boolean;
  jobWaiters: Set<Promise<void>>;
  activeJobCount: number;
  capacityRelease?: Deferred<void>;
};

export type ToolWaitersCtx = {
  maxConcurrency: number;
  activeJobCount: number;
  newJobWaitersAllowed: boolean;
  jobWaiters: Set<Promise<void>>;
  capacityRelease?: Deferred<void>;
  startWaitersPromise?: Promise<void>;
};
export type WorkerContext = {
  workerId: string;
  totalActiveJobCount: number;
  maxConcurrency: number;
  capabilities: {
    // capabilities
    [id: string]: WorkerCapability;
  };
  isRegistered: boolean;
  jobs: Map<string, JobContext<JobEventType>>;
  tools: Map<ToolId, ToolWaitersCtx>;
};

type PromiseResolve<T> = (value: T | PromiseLike<T>) => void;
type PromiseReject = (r?: unknown) => void;
type Deferred<T> = {
  promise: Promise<T>;
  resolve: PromiseResolve<T>;
  reject: PromiseReject;
};

export type WorkerDeps = {
  bus: EventBusPort;
  queue: QueuePort;
  toolRegistry: ToolRegistry<ToolId>;
  emitterFactory: EmitterFactory;
  streamRegistry: StreamRegistryPort;
};

export class Worker {
  #ctx: WorkerContext = {
    workerId: "generic-worker",
    totalActiveJobCount: 0,
    capabilities: {},
    jobs: new Map(),
    maxConcurrency: 1,
    isRegistered: false,
    tools: new Map(),
  };

  // DI deps
  #bus;
  #queue;
  #toolRegistry;
  #emitterFactory;
  #streamRegistry;

  constructor(workerId: string, deps: WorkerDeps) {
    this.#ctx.workerId = workerId;
    this.#bus = deps.bus;
    this.#queue = deps.queue;
    this.#toolRegistry = deps.toolRegistry;
    this.#emitterFactory = deps.emitterFactory;
    this.#streamRegistry = deps.streamRegistry;
    this.#buildToolCtx();
  }

  #subscribeToBus(): void {
    this.#bus.subscribe("workers.lifecycle", async (e: AnyEvent) => {
      if (e.type === "worker.registered") {
        const event = e as AnyEvent<"worker.registered">;
        if (
          event.data.workerId === this.#ctx.workerId &&
          event.data.status === "accepted"
        ) {
          this.#ctx.isRegistered = true;
          const spanId = this.#emitterFactory.generateSpanId();
          const traceParent = this.#emitterFactory.makeTraceParent(
            e.traceid,
            spanId
          );
          const logEmitter = this.#emitterFactory.newSystemEmitter({
            source: "lowercase://worker/subscribe-to-bus/worker-registered",
            traceId: e.traceid,
            spanId,
            traceParent,
          });
          await logEmitter.emit("system.logged", {
            log: "[worker] received registration accepted",
          });
        }
      }
    });
  }

  #buildToolCtx() {
    const toolIds = this.#toolRegistry.listToolIds();
    for (const id of toolIds) {
      const binding = this.#toolRegistry.getBinding(id);
      if (!binding) continue;

      this.#ctx.tools.set(id, {
        activeJobCount: 0,
        maxConcurrency: binding.spec.maxConcurrency,
        newJobWaitersAllowed: true,
        jobWaiters: new Set(),
      });
    }
  }

  // may resolve with other factors in the future for multiple tools
  resolveTool(capability: Capability, key?: string): ToolInstance {
    // return this.#toolRegistry.resolve(capability.tool.id, key);
    return this.#toolRegistry.createInstance(capability.tool.id);
  }

  async handleNewJob(event: AnyEvent): Promise<void> {
    const e = event as AllJobEvents;

    let jobDescription: JobDescriptor<typeof e.type>;
    try {
      jobDescription = interpretJob(e);
    } catch (err) {
      const jobEmitter = this.#emitterFactory.newJobEmitterFromEvent(
        e,
        "lowercase://worker/handle-new-job/interpret-job"
      );
      await jobEmitter.emit("job.failed", {
        job: e.data.job,
        status: "failed",
        reason: `"Error interpretting job.  ${err}`,
      });
      return;
    }

    const jobContext: JobContext<typeof e.type> = {
      id: jobDescription.id,
      capability: jobDescription.capability,
      metadata: {
        flowId: e.flowid,
        runId: e.runid,
        stepId: e.stepid,
        stepType: e.entity!,
        workerId: this.#ctx.workerId,
      },
      description: jobDescription,
      resolved: {},
      status: "preparing",
      startedAt: new Date().toISOString(),
      tool: jobDescription.capability,
    };
    this.#ctx.jobs.set(jobContext.id, jobContext);

    const executor = new JobExecutor(jobContext, {
      toolRegistry: this.#toolRegistry,
      streamRegistry: this.#streamRegistry,
    });

    const toolSpanId = this.#emitterFactory.generateSpanId();
    const toolTraceParent = this.#emitterFactory.makeTraceParent(
      e.traceid,
      toolSpanId
    );
    const toolEmitter = this.#emitterFactory.newToolEmitter({
      source: "lowercase://worker/job-done",
      flowid: e.flowid,
      runid: e.runid,
      stepid: e.stepid,
      jobid: e.jobid,
      toolid: jobContext.tool,
      traceId: e.traceid,
      spanId: toolSpanId,
      traceParent: toolTraceParent,
    });

    await toolEmitter.emit("tool.started", {
      tool: {
        id: jobContext.tool,
        name: "unknown",
        version: "unknown",
      },
      log: "about to execute a tool",
      status: "started",
    });

    let result;
    try {
      result = await executor.run();
    } catch (err) {
      const jobEmitter = this.#emitterFactory.newJobEmitterFromEvent(
        e,
        "lowercase://worker/handle-new-job/job-executor/run"
      );
      await jobEmitter.emit("job.failed", {
        job: e.data.job,
        status: "failed",
        reason: `"Error executing job.  ${err}`,
      });
      return;
    }

    const spanId = this.#emitterFactory.generateSpanId();
    const traceParent = this.#emitterFactory.makeTraceParent(e.traceid, spanId);

    const jobEmitter = this.#emitterFactory.newJobEmitter({
      source: "lowercase://worker/job-done",
      flowid: e.flowid,
      runid: e.runid,
      stepid: e.stepid,
      jobid: e.jobid,
      traceId: e.traceid,
      spanId,
      traceParent,
    });

    if (result) {
      await jobEmitter.emit("job.completed", {
        job: {
          id: e.jobid,
          capability: e.data.job.capability,
        },
        status: "completed",
        result: result,
      });
    } else {
      await jobEmitter.emit("job.failed", {
        job: {
          id: e.jobid,
          capability: e.data.job.capability,
        },
        status: "failed",
        reason: "tool returned undefined results",
      });
    }
  }

  setToolWaiterPolicy(toolId: ToolId, allowNew: boolean): void {
    const waiterCtx = this.#ctx.tools.get(toolId);
    if (!waiterCtx) return;
    waiterCtx.newJobWaitersAllowed = allowNew;
  }
  getToolWaitersSize(toolId: ToolId): number | undefined {
    return this.#ctx.tools.get(toolId)?.jobWaiters.size;
  }
  getToolActiveJobCount(toolId: ToolId): number | undefined {
    return this.#ctx.tools.get(toolId)?.activeJobCount;
  }
  getMetadata(): WorkerMetadata {
    const capabilities: Capability[] = [];
    const caps = this.#ctx.capabilities;

    // strip some fields from context and create new objects
    for (const id in caps) {
      const cap: Capability = {
        name: caps[id].name,
        queueId: caps[id].queueId,
        maxJobCount: caps[id].maxJobCount,
        tool: { ...caps[id].tool },
      };
      capabilities.push(cap);
    }
    const meta: WorkerMetadata = {
      id: this.#ctx.workerId,
      name: this.#ctx.workerId,
      type: "inprocess",
      capabilities,
    };
    return meta;
  }

  async requestRegistration(): Promise<void> {
    const meta = this.getMetadata();

    const toolList = this.#toolRegistry.listToolIds();
    const spanId = this.#emitterFactory.generateSpanId();
    const traceId = this.#emitterFactory.generateTraceId();
    const traceParent = this.#emitterFactory.makeTraceParent(traceId, spanId);

    const workerEmitter = this.#emitterFactory.newWorkerEmitter({
      source: "lowercase://worker/" + this.#ctx.workerId,
      workerid: this.#ctx.workerId,
      traceId,
      spanId,
      traceParent,
    });

    await workerEmitter.emit("worker.registration.requested", {
      worker: {
        id: meta.id,
      },
      id: meta.id,
      name: meta.name,
      type: "inprocess",
      capabilities: meta.capabilities,
    });
  }

  async start(): Promise<void> {
    this.#subscribeToBus();
    for (const [id, waiterCtx] of this.#ctx.tools.entries()) {
      const p = this.startToolJobWaiters(id);
      waiterCtx.startWaitersPromise = p;
    }
    const spanId = this.#emitterFactory.generateSpanId();
    const traceId = this.#emitterFactory.generateTraceId();
    const traceParent = this.#emitterFactory.makeTraceParent(traceId, spanId);

    const workerEmitter = this.#emitterFactory.newWorkerEmitter({
      source: "lowercase://worker/start",
      workerid: this.#ctx.workerId,
      traceId,
      spanId,
      traceParent,
    });

    await workerEmitter.emit("worker.started", {
      worker: {
        id: this.#ctx.workerId,
      },
      status: "started",
    });
  }
  stop(): void {}

  /**
   * Start job waiters (deferred promises) on a queue.
   *
   * When a job waiter gets a job (deferred promised is resolved), then
   * make a new job waiter up to the max concurrency defined in the
   * worker context for this tool.
   *
   * Set newJobWaitersAllowed = false to stop new waiters from being
   * created;
   *
   * @see WorkerContext for more on where that property exists.
   *
   * @param capabilityId id of the capability to start job waiters for
   */
  async startToolJobWaiters(toolId: ToolId): Promise<void> {
    const waiterCtx = this.#ctx.tools.get(toolId);
    if (!waiterCtx) return;
    while (waiterCtx.newJobWaitersAllowed) {
      if (waiterCtx.activeJobCount < waiterCtx.maxConcurrency) {
        try {
          const event = await this.#queue.reserve(toolId, this.#ctx.workerId);

          // TODO: change queue from null to rejected?
          if (event === null) {
            if (!waiterCtx.newJobWaitersAllowed) break;
            continue;
          }

          const e = event as AllJobEvents;
          const jobEmitter = this.#emitterFactory.newJobEmitterFromEvent(
            e,
            "lowercase://worker/tool-waiters/job"
          );
          await jobEmitter.emit("job.started", {
            job: e.data.job,
            status: "started",
          });

          waiterCtx.activeJobCount++;
          const waiter = this.handleNewJob(event).finally(async () => {
            waiterCtx.jobWaiters.delete(waiter);
            waiterCtx.activeJobCount--;
            if (waiterCtx.capacityRelease) {
              waiterCtx.capacityRelease.resolve();
            }
          });

          waiterCtx.jobWaiters.add(waiter);
        } catch (err) {
          console.log(err);
          if (!waiterCtx.newJobWaitersAllowed) break;
          continue;
        }
      } else {
        waiterCtx.capacityRelease = this.#makeDeferred<void>();
        await waiterCtx.capacityRelease.promise;
      }
    }
  }

  /**
   * Stops all job waiters in the queue and marks each tool to stop
   * new job waiters.
   *
   * Also releases any capacity holder promises that may be pending after
   * new waiters cannot be created.
   */
  async stopAllJobWaiters() {
    const tools = this.#ctx.tools;
    // need to stop each tool from making new waiters first
    for (const waiterCtx of tools.values()) {
      waiterCtx.newJobWaitersAllowed = false;
      waiterCtx.jobWaiters.clear();
      waiterCtx.activeJobCount = 0;

      if (waiterCtx.capacityRelease) waiterCtx.capacityRelease.resolve();
    }
    this.#queue.abortAllForWorker(this.#ctx.workerId);
  }

  #makeDeferred<T>(): Deferred<T> {
    let resolve: PromiseResolve<T>;
    let reject: PromiseReject;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    return { promise, resolve: resolve!, reject: reject! };
  }
}

import type {
  EmitterFactoryPort,
  EventBusPort,
  EventParserPort,
  JobParserPort,
  QueuePort,
  StreamRegistryPort,
  ToolDeps,
} from "@lcase/ports";
import type {
  AnyEvent,
  WorkerMetadata,
  ToolId,
  PipeData,
  JobQueuedEvent,
  JobEventType,
  JobCompletedType,
  JobFailedType,
} from "@lcase/types";
import { ToolRegistry } from "@lcase/tools";
import type { JobContext } from "./types.js";
import { EventParser } from "@lcase/events/parsers";

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
  isRegistered: boolean;
  jobs: Map<string, JobContext>;
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
  emitterFactory: EmitterFactoryPort;
  streamRegistry: StreamRegistryPort;
  jobParser: JobParserPort;
};

export class Worker {
  #ctx: WorkerContext = {
    workerId: "generic-worker",
    totalActiveJobCount: 0,
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
  #jobParser;
  constructor(workerId: string, deps: WorkerDeps) {
    this.#ctx.workerId = workerId;
    this.#bus = deps.bus;
    this.#queue = deps.queue;
    this.#toolRegistry = deps.toolRegistry;
    this.#emitterFactory = deps.emitterFactory;
    this.#streamRegistry = deps.streamRegistry;
    this.#jobParser = deps.jobParser;
    this.#buildToolCtx();
  }

  #subscribeToBus(): void {
    this.#bus.subscribe("worker.registered", async (e: AnyEvent) => {
      if (e.type === "worker.registered") {
        const event = e as AnyEvent<"worker.registered">;
        if (
          event.data.workerId === this.#ctx.workerId &&
          event.data.status === "accepted"
        ) {
          this.#ctx.isRegistered = true;

          const logEmitter = this.#emitterFactory.newSystemEmitterNewSpan(
            {
              source: "lowercase://worker/subscribe-to-bus/worker-registered",
            },
            e.traceid
          );
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

  async handleNewJob(event: AnyEvent): Promise<void> {
    const job = this.#jobParser.parseJobQueued(event);
    if (!job) return;
    const e = job.event;

    const jobContext: JobContext = {
      jobId: e.data.job.id,
      toolId: e.data.job.toolid ?? "",
      capability: e.stepid,
      flowId: e.flowid,
      runId: e.runid,
      stepId: e.stepid,
      stepType: e.entity!,
      workerId: this.#ctx.workerId,
      startedAt: new Date().toISOString(),
    };
    const toolEmitter = this.#emitterFactory.newToolEmitterNewSpan(
      {
        ...e,
        source: "localhost://worker/handle-new-job/186",
        toolid: jobContext.toolId,
      },
      e.traceid
    );

    await toolEmitter.emit("tool.started", {
      tool: {
        id: jobContext.toolId,
        name: jobContext.toolId,
        version: "unknown",
      },
      log: "about to execute a tool",
      status: "started",
    });

    const deps = this.#makeTookDeps(
      e.data.pipe ?? {},
      this.#emitterFactory,
      this.#streamRegistry
    );
    const tool = this.#toolRegistry.createInstance(
      e.data.job.toolid as ToolId,
      deps
    );

    this.#ctx.jobs.set(jobContext.jobId, jobContext);

    let toolResult;
    try {
      const manualType = `job.${job.capId}.started`;
      const type = this.#jobParser.parseJobStartedType(manualType);

      if (!type) {
        throw new Error(`[worker] invalid type; could not parse ${manualType}`);
      }

      const jobEmitter = this.#emitterFactory.newJobEmitterFromEvent(
        e,
        "lowercase://worker/handle-new-job"
      );
      await jobEmitter.emit(type, e.data);

      toolResult = await tool.invoke(event);
    } catch (err) {
      const manualType = `job.${job.capId}.failed`;
      const type = this.#jobParser.parseJobFailedType(manualType);

      if (!type) {
        throw new Error(`[worker] invalid type; could not parse ${manualType}`);
      }

      const jobEmitter = this.#emitterFactory.newJobEmitterFromEvent(
        e,
        "lowercase://worker/handle-new-job/job-executor/run"
      );
      await jobEmitter.emit(type, {
        job: e.data.job,
        status: "failure",
        reason: `"Error executing job.  ${err}`,
      });
      return;
    }

    const jobEmitter = this.#emitterFactory.newJobEmitterFromEvent(
      e,
      "lowercase://worker/handle-new-job/221"
    );

    if (toolResult) {
      const manualType = `job.${job.capId}.completed`;
      const type = this.#jobParser.parseJobCompletedType(manualType);
      if (!type) {
        throw new Error(`[worker] invalid type; could not parse ${manualType}`);
      }
      await jobEmitter.emit(type, {
        job: e.data.job,
        status: "success",
      });
    } else {
      const manualType = `job.${job.capId}.failed`;
      const type = this.#jobParser.parseJobFailedType(manualType);
      if (!type) {
        throw new Error(`[worker] invalid type; could not parse ${manualType}`);
      }
      await jobEmitter.emit(type, {
        job: e.data.job,
        status: "failure",
        reason: "tool returned undefined results",
      });
    }
  }

  #makeTookDeps(
    pipe: PipeData,
    ef: EmitterFactoryPort,
    sr: StreamRegistryPort
  ): ToolDeps {
    const deps: ToolDeps = { ef };
    if (pipe.to?.id) {
      deps.producer = sr.getProducer(pipe.to.id);
    }
    if (pipe.from?.id) {
      deps.consumer = sr.getConsumer(pipe.from.id);
    }
    return deps;
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
    const meta: WorkerMetadata = {
      id: this.#ctx.workerId,
      name: this.#ctx.workerId,
      type: "internal",
      tools: this.#toolRegistry.listToolIds(),
    };
    return meta;
  }

  async requestRegistration(): Promise<void> {
    const meta = this.getMetadata();

    const workerEmitter = this.#emitterFactory.newWorkerEmitterNewTrace({
      source: "lowercase://worker/" + this.#ctx.workerId,
      workerid: this.#ctx.workerId,
    });
    await workerEmitter.emit("worker.registration.requested", {
      ...meta,
      worker: {
        id: meta.id,
      },
    });
  }

  async start(): Promise<void> {
    this.#subscribeToBus();
    for (const [id, waiterCtx] of this.#ctx.tools.entries()) {
      const p = this.startToolJobWaiters(id);
      waiterCtx.startWaitersPromise = p;
    }

    const workerEmitter = this.#emitterFactory.newWorkerEmitterNewTrace({
      source: "lowercase://worker/start",
      workerid: this.#ctx.workerId,
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

import type {
  EmitterFactoryPort,
  EventBusPort,
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
  ToolEvent,
  RateLimitPolicy,
} from "@lcase/types";
import { ToolRegistry } from "@lcase/tools";
import type { JobContext } from "./types.js";

export type ToolWaitersCtx = {
  maxConcurrency: number;
  activeJobCount: number;
  newJobWaitersAllowed: boolean;
  jobWaiters: Set<Promise<void>>;
  capacityRelease?: Deferred<void>;
  startWaitersPromise?: Promise<void>;
  inQueue: number;
  rateLimitPolicy?: RateLimitPolicy;
  rateLimitTs?: number;
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
  enableSideEffects = true;
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

    this.#bus.subscribe("replay.mode.submitted", async (event: AnyEvent) => {
      if (event.type !== "replay.mode.submitted") return;
      const e = event as AnyEvent<"replay.mode.submitted">;
      this.handleReplayModeSubmitted(e);
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
        inQueue: 0,
        rateLimitPolicy: binding.spec.rateLimit,
      });
    }
  }

  handleReplayModeSubmitted(event: AnyEvent<"replay.mode.submitted">) {
    this.enableSideEffects = event.data.enableSideEffects;
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

    let toolEvent: ToolEvent<"tool.completed"> | ToolEvent<"tool.failed">;
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

      if (!this.enableSideEffects) return;
      await jobEmitter.emit(type, e.data);

      toolEvent = await tool.invoke(event);
    } catch (err) {
      const manualType = `job.${job.capId}.failed`;
      const type = this.#jobParser.parseJobFailedType(manualType);

      if (!type) {
        throw new Error(`[worker] invalid type; could not parse ${manualType}`);
      }

      if (!this.enableSideEffects) return;
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

    if (toolEvent.type === "tool.completed") {
      const manualType = `job.${job.capId}.completed`;
      const type = this.#jobParser.parseJobCompletedType(manualType);
      if (!type) {
        throw new Error(`[worker] invalid type; could not parse ${manualType}`);
      }
      await jobEmitter.emit(type, {
        job: e.data.job,
        status: "success",
        ...(toolEvent.data.payload ? { result: toolEvent.data.payload } : {}),
      });
    } else if (toolEvent.type === "tool.failed") {
      const manualType = `job.${job.capId}.failed`;
      const type = this.#jobParser.parseJobFailedType(manualType);
      if (!type) {
        throw new Error(`[worker] invalid type; could not parse ${manualType}`);
      }
      await jobEmitter.emit(type, {
        job: e.data.job,
        status: "failure",
        reason: toolEvent.data.reason,
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
    if (!this.enableSideEffects) return;
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

    if (!this.enableSideEffects) return;

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
    const ctx = this.#ctx.tools.get(toolId);
    if (!ctx) return;
    while (ctx.newJobWaitersAllowed) {
      if (ctx.activeJobCount < ctx.maxConcurrency && ctx.inQueue === 0) {
        try {
          ctx.inQueue++;
          const event = await this.#queue.reserve(toolId, this.#ctx.workerId);
          ctx.inQueue--;

          // TODO: change queue from null to rejected?
          if (event === null) {
            if (!ctx.newJobWaitersAllowed) break;
            continue;
          }

          ctx.activeJobCount++;
          await this.handleRateLimit(ctx);
          const waiter = this.handleNewJob(event).finally(async () => {
            ctx.jobWaiters.delete(waiter);
            ctx.activeJobCount--;
            if (ctx.capacityRelease) {
              ctx.capacityRelease.resolve();
            }
          });

          ctx.jobWaiters.add(waiter);
        } catch (err) {
          console.log(err);
          if (!ctx.newJobWaitersAllowed) break;
        }
      } else {
        ctx.capacityRelease = this.#makeDeferred<void>();
        await ctx.capacityRelease.promise;
      }
    }
  }

  async handleRateLimit(ctx: ToolWaitersCtx) {
    if (!ctx.rateLimitPolicy) return;

    const now = Date.now();
    if (!ctx.rateLimitTs) {
      ctx.rateLimitTs = now;
      return;
    } else {
      const elapsed = Math.abs(now - ctx.rateLimitTs);
      if (elapsed >= ctx.rateLimitPolicy.perMs) {
        ctx.rateLimitTs = now;
        return;
      }
      const delayMs = Math.abs(ctx.rateLimitPolicy!.perMs - elapsed);
      ctx.rateLimitTs = now;
      console.log("[worker] waiting ms:", delayMs);
      await new Promise((res) => {
        setTimeout(res, delayMs);
      });
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

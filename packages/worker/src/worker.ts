import type {
  ArtifactsPort,
  EmitterFactoryPort,
  EventBusPort,
  JobParserPort,
  JsonValue,
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
  JobEvent,
  JobQueuedEvent,
  ToolContext,
  Ref,
  JobStartedData,
  JobHttpJsonData,
  JobMcpData,
  JobStartedEvent,
} from "@lcase/types";
import { ToolRegistry } from "@lcase/tools";
import type { JobContext } from "./types.js";
import {
  bindReference,
  resolveJsonPath,
  resolvePath,
} from "@lcase/json-ref-binder";

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
  waitingJobQueuedEvents: Map<string, JobQueuedEvent>;
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
  artifacts: ArtifactsPort;
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
  artifacts: ArtifactsPort;
  constructor(workerId: string, deps: WorkerDeps) {
    this.#ctx.workerId = workerId;
    this.#bus = deps.bus;
    this.#queue = deps.queue;
    this.#toolRegistry = deps.toolRegistry;
    this.#emitterFactory = deps.emitterFactory;
    this.#streamRegistry = deps.streamRegistry;
    this.#jobParser = deps.jobParser;
    this.artifacts = deps.artifacts;
    this.#buildToolCtx();
  }

  #subscribeToBus(): void {
    this.#bus.subscribe("worker.profile.added", async (e: AnyEvent) => {
      if (e.type === "worker.profile.added") {
        const event = e as AnyEvent<"worker.profile.added">;
        if (
          event.workerid === this.#ctx.workerId &&
          event.data.status === "accepted"
        ) {
          this.#ctx.isRegistered = true;

          const logEmitter = this.#emitterFactory.newSystemEmitterNewSpan(
            {
              source: "lowercase://worker/subscribe-to-bus/worker-registered",
            },
            e.traceid,
          );
          await logEmitter.emit("system.logged", {
            log: "[worker] received resource manager response",
          });
        }
      }
    });

    this.#bus.subscribe("replay.mode.submitted", async (event: AnyEvent) => {
      if (event.type !== "replay.mode.submitted") return;
      const e = event as AnyEvent<"replay.mode.submitted">;
      this.handleReplayModeSubmitted(e);
    });

    this.#bus.subscribe(
      "limiter.slot.granted",
      async (event: AnyEvent) => await this.handleGranted(event),
    );
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
        waitingJobQueuedEvents: new Map<string, JobQueuedEvent>(),
      });
    }
  }

  handleReplayModeSubmitted(event: AnyEvent<"replay.mode.submitted">) {
    this.enableSideEffects = event.data.enableSideEffects;
  }

  async handleGranted(event: AnyEvent) {
    if (event.type !== "limiter.slot.granted") return;
    const e = event as AnyEvent<"limiter.slot.granted">;
    if (e.data.workerId !== this.#ctx.workerId) return;

    const { toolId, jobId } = e.data;
    const toolCtx = this.#ctx.tools.get(toolId);
    if (!toolCtx) return;
    const job = toolCtx.waitingJobQueuedEvents.get(jobId);
    if (!job) return;

    this.startWaitingJob(job, toolCtx);
  }

  startWaitingJob(event: JobQueuedEvent, ctx: ToolWaitersCtx) {
    const waiter = this.handleNewJob(event).finally(async () => {
      ctx.jobWaiters.delete(waiter);
      ctx.activeJobCount--;
      if (ctx.capacityRelease) {
        ctx.capacityRelease.resolve();
      }
    });

    ctx.jobWaiters.add(waiter);
  }

  setJobContext(e: JobQueuedEvent) {
    const jobContext: JobContext = {
      jobId: e.jobid,
      toolId: e.toolid,
      capability: e.capid,
      flowId: e.flowid,
      runId: e.runid,
      stepId: e.stepid,
      stepType: e.capid,
      workerId: this.#ctx.workerId,
      startedAt: new Date().toISOString(),
    };
    this.#ctx.jobs.set(jobContext.jobId, jobContext);
  }
  async emitJobStarted(
    event: JobQueuedEvent,
  ): Promise<JobStartedEvent | undefined> {
    if (!this.enableSideEffects) return;
    const manualType = `job.${event.capid}.started`;
    const type = this.#jobParser.parseJobStartedType(manualType);

    if (!type) {
      throw new Error(`[worker] invalid type; could not parse ${manualType}`);
    }

    const jobEmitter = this.#emitterFactory.newJobEmitterFromEvent(
      event,
      "lowercase://worker/handle-new-job",
    );

    if (!this.enableSideEffects) return;
    const { refs, ...data } = event.data;

    await this.bindValueRefs(event.data.refs, data);
    return await jobEmitter.emit(type, data);
  }

  async handleNewJob(event: JobQueuedEvent): Promise<void> {
    const job = this.#jobParser.parseJobQueued(event);
    if (!job) return;
    const e = job.event;

    this.setJobContext(e);

    const deps = this.#makToolDeps(
      {},
      this.#emitterFactory,
      this.#streamRegistry,
    );
    const tool = this.#toolRegistry.createInstance(e.toolid, deps);
    let toolEvent: ToolEvent<"tool.completed"> | ToolEvent<"tool.failed">;

    const startedEvent = await this.emitJobStarted(e);
    if (!startedEvent) return;

    toolEvent = await tool.invoke(startedEvent);
    const storeHash = await this.storeJsonArtifact(
      toolEvent.data.payload as JsonValue,
    );

    const workerEmitter = this.#emitterFactory.newWorkerEmitterNewSpan(
      {
        source: `lowercase://worker/${this.#ctx.workerId}`,
        workerid: this.#ctx.workerId,
      },
      e.traceid,
    );
    await workerEmitter.emit("worker.slot.finished", {
      jobId: e.jobid,
      runId: e.runid,
      toolId: e.toolid,
    });

    const jobEmitter = this.#emitterFactory.newJobEmitterFromEvent(
      e,
      `lowercase://worker/${this.#ctx.workerId}`,
    );

    if (toolEvent.type === "tool.completed") {
      const manualType = `job.${job.capId}.completed`;
      const type = this.#jobParser.parseJobCompletedType(manualType);
      if (!type) {
        throw new Error(`[worker] invalid type; could not parse ${manualType}`);
      }

      await jobEmitter.emit(type, {
        status: "success",
        output: storeHash ? storeHash : null,
      });
    } else if (toolEvent.type === "tool.failed") {
      const manualType = `job.${job.capId}.failed`;
      const type = this.#jobParser.parseJobFailedType(manualType);
      if (!type) {
        throw new Error(`[worker] invalid type; could not parse ${manualType}`);
      }
      await jobEmitter.emit(type, {
        status: "failure",
        output: storeHash ? storeHash : null,
        message: toolEvent.data.reason,
      });
    }
  }

  #makToolDeps(
    pipe: PipeData,
    ef: EmitterFactoryPort,
    sr: StreamRegistryPort,
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
    await workerEmitter.emit("worker.profile.submitted", meta);
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

  async storeJsonArtifact(
    output: JsonValue | undefined,
  ): Promise<string | undefined> {
    if (output === undefined) return;
    const result = await this.artifacts.putJson(output);
    if (result.ok) return result.value;

    console.log(
      "Error storing json artifact",
      result.error.code,
      result.error.message,
    );
  }

  async getJsonArtifact(hash: string): Promise<JsonValue | undefined> {
    const result = await this.artifacts.getJson(hash);
    if (result.ok) return result.value;
    return;
  }

  async bindValueRefs(refs: Ref[], data: Record<string, unknown>) {
    for (const ref of refs) {
      if (ref.hash === null) continue;
      const json = await this.getJsonArtifact(ref.hash);
      if (json === undefined) continue;
      const value = resolveJsonPath(ref.valuePath, json);
      bindReference(ref, data, value);
    }
  }

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

          const workerEmitter = this.#emitterFactory.newWorkerEmitterNewSpan(
            {
              source: "lowercase://worker",
              workerid: this.#ctx.workerId,
            },
            event.traceid,
          );

          const e = event as JobQueuedEvent;

          await workerEmitter.emit("worker.job.dequeued", {
            eventId: e.id,
            eventType: e.type,
            spanId: e.spanid,
            flowId: e.flowid,
            runId: e.runid,
            stepId: e.stepid,
            jobId: e.jobid,
            capId: e.capid,
            toolId: e.toolid,
          });

          ctx.activeJobCount++;
          await this.requestSlot(e);
          await this.handleRateLimit(ctx);
          // const waiter = this.handleNewJob(event).finally(async () => {
          //   ctx.jobWaiters.delete(waiter);
          //   ctx.activeJobCount--;
          //   if (ctx.capacityRelease) {
          //     ctx.capacityRelease.resolve();
          //   }
          // });

          // ctx.jobWaiters.add(waiter);
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

  async requestSlot(event: JobQueuedEvent) {
    const ctx = this.#ctx.tools.get(event.toolid);
    if (ctx) ctx.waitingJobQueuedEvents.set(event.jobid, event);
    const emitter = this.#emitterFactory.newWorkerEmitterNewSpan(
      {
        source: `lowercase://worker/${this.#ctx.workerId}`,
        workerid: this.#ctx.workerId,
      },
      event.traceid,
    );
    await emitter.emit("worker.slot.requested", {
      jobId: event.jobid,
      runId: event.runid,
      toolId: event.toolid,
    });
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

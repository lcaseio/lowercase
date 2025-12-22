import type { EventBusPort } from "@lcase/ports/bus";
import type {
  EmitterFactoryPort,
  JobCompletedParsed,
  JobDelayedParsed,
  JobFailedParsed,
  JobParserPort,
  JobQueuedParsed,
  JobSubmittedParsed,
} from "@lcase/ports/events";
import type { ResourceManagerPort } from "../../ports/dist/rm/resource-manager.port.js";
import type { QueuePort } from "@lcase/ports";
import type {
  AnyEvent,
  InternalToolsMap,
  JobDelayedEvent,
  JobDelayedType,
  JobEvent,
  JobEventType,
  JobQueuedEvent,
  JobQueuedType,
  JobSubmittedEvent,
  ToolSpec,
} from "@lcase/types";
import { internalToolConfig } from "./internal-tools.map.js";
import { CapId } from "../../types/dist/flow/map.js";
import { defaultCapToolMap } from "./default-tools.map.js";
import type {
  RmEffect,
  RmEffectHandler,
  RmEffectHandlerRegistry,
  RmMessage,
  RmPlanner,
  RmReducer,
} from "./rm.types.js";
import { emitError, wireEffectHandlers } from "./registries/effect.registry.js";
import { reducers } from "./registries/reducer.registry.js";
import { planners } from "./registries/planner.registry.js";

export type ResourceManagerDeps = {
  ef: EmitterFactoryPort;
  queue: QueuePort;
  jobParser: JobParserPort;
  bus: EventBusPort;
};

export type CapRegisteredToolsMap = {
  [T in CapId]?: Set<string>;
};

export type JobParsedAny =
  | JobSubmittedParsed
  | JobCompletedParsed
  | JobFailedParsed;

type ActiveJobsPerTool = {
  [t in string]: number;
};
type ToolId = string;
type WorkerId = string;
type JobId = string;
type RunId = string;

type WorkerRegistryEntry = {
  canRunTools: Record<ToolId, true>;
  name: string;
  type: "internal" | "external";
  status: "online" | "offline";
};

/**
 * need to do something that describes whats happening
 *
 * ready to be queued
 * ready to be delayed
 *
 * actually queued
 * actually delayed
 *
 * started (or dequeued)
 * finished (failed or completed)
 *
 * per tool vs per run
 *
 * status: {
 *   queued: [], // or linked list
 *   delayed: [], // or linked list
 * }
 */

type ToolRuntimeOld = {
  inFlight: Record<
    JobId,
    { runId: RunId; workerId?: WorkerId; startedAt: string }
  >;
  activeJobCount: number;
  queue: {
    ready: JobId[]; // in queue ready to be picked up
    delayed: Array<{ jobId: JobId; runId: RunId }>;
  };
};

type RunRuntimeOld = {
  jobTool: Record<JobId, ToolId>;
  activeToolCount: Record<ToolId, number>;
  delayedJobs: Record<JobId, { reason: string; since: string; toolId: ToolId }>;
};

type JobEntry = {
  jobId: JobId;
  toolId: ToolId;
  runId: RunId;
  capId: CapId;
};

// tool is global across all runs per tool
export type ToolRuntime = {
  activeJobCount: number;

  queued: Record<JobId, JobEntry>;
  delayed: Record<JobId, JobEntry>;
  pendingQueued: Record<JobId, JobEntry>;
  pendingQueuedCount: number;
  pendingDelayed: Record<JobId, JobEntry>;
  pendingDelayedCount: number;
};

// state per run for replay
export type RunRuntime = {
  jobToolMap: Record<JobId, ToolId>;
  activeJobsPerToolCount: Record<ToolId, number>;
  queued: Record<JobId, JobEntry>;
  delayed: Record<JobId, JobEntry>;
  pendingQueued: Record<JobId, JobEntry>;
  pendingQueuedCount: number;
  pendingDelayed: Record<JobId, JobEntry>;
  pendingDelayedCount: number;
};

export type RmState = {
  policy: RmPolicyState;
  registry: {
    tools: Record<ToolId, ToolSpec & { hasOnlineWorker: boolean }>;
    workers: Record<WorkerId, WorkerRegistryEntry>;
  };
  runtime: {
    perTool: Record<ToolId, ToolRuntime>;
    perRun: Record<RunId, RunRuntime>;
  };
};
export type RmPolicyState = {
  defaultToolMap: Record<CapId, string>;
};

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
 * - advanced policy based tool decisions
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
  activeJobsPerTool: ActiveJobsPerTool = {};

  busStopTopics = new Map<string, () => void>();

  messages: RmMessage[] = [];
  isProcessing = false;
  enableSideEffects = true;
  state: RmState;
  handlers: RmEffectHandlerRegistry;

  constructor(deps: ResourceManagerDeps) {
    this.#bus = deps.bus;
    this.#ef = deps.ef;
    this.#queue = deps.queue;
    this.#jobParser = deps.jobParser;
    this.#internalTools = internalToolConfig;
    this.#capDefaultToolMap = defaultCapToolMap;
    this.mapInternalTools();
    this.handlers = wireEffectHandlers({
      ef: deps.ef,
      jobParser: deps.jobParser,
      queue: deps.queue,
      emitErrorFn: emitError,
    });

    this.state = {
      policy: {
        defaultToolMap: {
          httpjson: "httpjson",
          mcp: "mcp",
        },
      },
      registry: {
        tools: {},
        workers: {},
      },
      runtime: {
        perTool: {},
        perRun: {},
      },
    } satisfies RmState;
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
    const replay = "replay.mode.submitted";

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

    this.busStopTopics.set(
      replay,
      this.#bus.subscribe(replay, async (event) => {
        this.handleReplayModeSubmitted(event);
      })
    );
  }
  stop() {
    for (const [_topic, cb] of this.busStopTopics.entries()) {
      cb();
    }
  }

  async handleWorkerRequest(event: AnyEvent) {
    if (event.type === "worker.profile.submitted") {
      const e = event as AnyEvent<"worker.profile.submitted">;
      this.registerWorkerTools(e);
    }
  }
  handleReplayModeSubmitted(event: AnyEvent) {
    if (event.type !== "replay.mode.submitted") return;
    const e = event as AnyEvent<"replay.mode.submitted">;
    this.enableSideEffects = e.data.enableSideEffects;
  }

  /*-- new architecture refactor starts -- */
  processAll() {
    if (this.messages.length === 0) return;
    this.isProcessing = true;
    while (this.messages.length > 0) {
      this.processNext();
    }
    this.isProcessing = false;
  }
  processNext() {
    const message = this.messages.shift();
    if (!message) return;

    const reducer = reducers[message.type] as RmReducer | undefined;
    const planner = planners[message.type] as RmPlanner | undefined;

    let newState = reducer ? reducer(this.state, message) : undefined;
    newState ??= this.state; // default to current state if new state is undefined

    const effects = planner ? planner(this.state, newState, message) : [];

    this.state = newState;

    for (const effect of effects) {
      this.executeEffect(effect);
    }
  }
  executeEffect(effect: RmEffect) {
    const handler = this.handlers[effect.type] as
      | RmEffectHandler<any>
      | undefined;
    if (!handler) return;
    handler(effect);
  }
  /*-- new architecture refactor ends -- */

  async handleCompletedOrFailed(event: AnyEvent) {
    let job: JobCompletedParsed | JobFailedParsed | undefined;
    if (event.type.endsWith(".completed")) {
      job = this.#jobParser.parseJobCompleted(event);
    } else if (event.type.endsWith(".failed")) {
      job = this.#jobParser.parseJobFailed(event);
    }

    if (this.jobHasErrors(event, job) || !job) return;

    const active = Math.max(
      0,
      (this.#activeTools.get(job.event.data.job.toolid) ?? 0) - 1
    );
    this.#activeTools.set(job.event.data.job.toolid, active);

    const max = this.#internalTools[job.event.data.job.toolid].maxConcurrency;
    let current = this.#activeTools.get(job.event.data.job.toolid) ?? 0;

    if (current < max) {
      await this.queueDelayedJob(job.event.data.job.toolid);
    }
  }

  async queueDelayedJob(toolId: string) {
    const anyEvent = await this.#queue.dequeue(`${toolId}.delayed`);
    if (!anyEvent) return;

    const job = this.#jobParser.parseJobDelayed(anyEvent);
    if (!job) {
      this.emitError(anyEvent, "Dequeued invalid job from delayed queue.", job);
      return;
    }
    const max = this.#internalTools[toolId].maxConcurrency;
    let current = this.#activeTools.get(toolId) ?? 0;

    if (current < max) {
      const type = `job.${job.capId}.queued` as JobQueuedType;
      const jobQueued = await this.makeQueuedEventFromDelayed(job.event, type);
      if (!jobQueued) return;
      const jobEmitter = this.#ef.newJobEmitterFromEvent(
        jobQueued.event,
        "lowercase://rm/queue-delayed-job"
      );

      if (!this.enableSideEffects) return;
      const newEvent = await jobEmitter.emit(type, jobQueued.event.data);
      this.#queue.enqueue(newEvent.data.job.toolid, newEvent);
      this.#activeTools.set(toolId, ++current);
    }
  }

  async handleSubmitted(event: AnyEvent): Promise<void> {
    const e = this.#jobParser.parseJobSubmitted(event);
    // if (await this.jobHasErrors(event, job)) return;
    if (!e) return;

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
  jobHasErrors<T extends JobParsedAny>(
    event: AnyEvent,
    job: T | undefined
  ): boolean {
    if (!job) {
      this.emitError(event, "Error parsing job.", job);
      return true;
    }
    if (job.capId in this.#capRegisteredToolsMap === false) {
      this.emitError(
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
    if (!this.enableSideEffects) return;
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

  getActiveJobs(toolId: string) {
    if (this.#activeTools.get(toolId) === undefined) return 0;
    return this.activeJobsPerTool[toolId];
  }

  async queueOrDelaySubmitted(e: JobSubmittedEvent) {
    const toolId = e.data.job.toolid!;
    const capId = e.data.job.capid;
    const max = this.#internalTools[toolId].maxConcurrency;
    let current = this.#activeTools.get(toolId) ?? 0;
    console.log("current first", current);

    const jobEmitter = this.#ef.newJobEmitterFromEvent(
      e,
      "lowercase://rm/queue-or-delay-submitted"
    );
    if (current < max) {
      const type = `job.${capId}.queued` as JobQueuedType;
      const job = this.makeQueuedEventFromSubmitted(e, type);
      if (!job) return;

      this.#activeTools.set(toolId, ++current);
      if (!this.enableSideEffects) return;
      const newEvent = await jobEmitter.emit(type, job.event.data);
      this.#queue.enqueue(toolId, newEvent);
      console.log(current);
    } else {
      const type = `job.${capId}.delayed` as JobDelayedType;
      const job = await this.makeDelayedEventFromSubmitted(e, type);
      if (!job) return;

      if (!this.enableSideEffects) return;
      const newEvent = await jobEmitter.emit(type, job.event.data);
      this.#queue.enqueue(`${toolId}.delayed`, newEvent);
    }
  }

  makeQueuedEventFromSubmitted(
    event: JobSubmittedEvent,
    type: JobQueuedType
  ): JobQueuedParsed | undefined {
    const e = event as unknown as JobQueuedEvent;
    e.type = type;
    e.action = "queued";
    const job = this.#jobParser.parseJobQueued(e);
    if (!job) {
      this.emitError(event, "Unable to create queued event", event);
    }
    return job;
  }

  async makeDelayedEventFromSubmitted(
    event: JobSubmittedEvent,
    type: JobDelayedType
  ): Promise<JobDelayedParsed | undefined> {
    const e = event as unknown as JobDelayedEvent;
    e.type = type;
    e.action = "delayed";
    const job = this.#jobParser.parseJobDelayed(e);
    if (!job) {
      await this.emitError(event, "Unable to create delayed event", event);
    }
    return job;
  }
  async makeQueuedEventFromDelayed(
    event: JobDelayedEvent,
    type: JobQueuedType
  ): Promise<JobQueuedParsed | undefined> {
    const e = event as unknown as JobQueuedEvent;
    e.type = type;
    e.action = "queued";
    const job = this.#jobParser.parseJobQueued(e);
    if (!job) {
      await this.emitError(
        event,
        "Unable to create queued event from delayed",
        event
      );
    }
    return job;
  }

  async registerWorkerTools(event: AnyEvent<"worker.profile.submitted">) {
    for (const tool of event.data.tools) {
      this.#availableTools.add(tool);
    }

    if (!this.enableSideEffects) return;

    const we = this.#ef.newWorkerEmitterNewSpan(
      {
        source: "lowercase://rm/register-worker-tools",
        workerid: event.data.id,
      },
      event.traceid
    );
    await we.emit("worker.profile.added", {
      ok: true,
      status: "accepted",
    });
  }
}

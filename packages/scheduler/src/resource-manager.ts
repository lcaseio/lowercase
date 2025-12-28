import type { EventBusPort } from "@lcase/ports/bus";
import type {
  JobCompletedParsed,
  JobFailedParsed,
  JobParserPort,
} from "@lcase/ports/events";
import type { ResourceManagerPort } from "../../ports/dist/rm/resource-manager.port.js";
import type { AnyEvent, InternalToolsMap, WorkerEvent } from "@lcase/types";
import { internalToolConfig } from "./internal-tools.map.js";
import type {
  JobDelayedMsg,
  JobDequeuedMsg,
  JobFinishedMsg,
  JobQueuedMsg,
  JobResumedMsg,
  JobSubmittedMsg,
  RmEffect,
  RmEffectHandler,
  RmEffectHandlerRegistry,
  RmMessage,
  RmPlanner,
  RmReducer,
  WorkerProfileSubmittedMsg,
} from "./rm.types.js";
import { emitError, wireEffectHandlers } from "./registries/effect.registry.js";
import { reducers } from "./registries/reducer.registry.js";
import { planners } from "./registries/planner.registry.js";
import type { ResourceManagerDeps, RmState } from "./rm.state.type.js";
import path from "path";
import { appendFileSync, writeFileSync } from "fs";

/**
 * the resource manager handles queueing jobs for workers.
 *
 * workers register the tools which they support here.
 * when a job arrives, the resource manager looks at worker availability and
 * concurrency settings per tool.
 *
 * if a worker is available and concurrency rules allow it, the job is placed
 * in a tool queue. workers read jobs from specific tool queues.
 *
 * if a worker is not available or concurrency rules do not allow the job to
 * run currently, it is placed in a delayed queue per tool.
 *
 * when a worker concurrency slot opens, the resource manager grabs the first
 * job from the delayed queue per tool, and queues it for a worker.
 *
 * the state follows the same reducer -> planner -> effects pattern the engine
 * does to help keep state updates synchronous, testable, and deterministic, with events
 * being the source of truth, and an internal message queue to chain logical operations.
 *
 * side effects like queueing a job or emitting an event are all done outside
 * the synchronous state update, and never hook directly back into the resource manager.
 * they communicate back through events to keep operations simple and observable,
 * if perhaps a bit verbose.
 *
 * the resource manager also handles capabilities to tool resolution, but
 * currently every tool is the always the same as the capability.
 * see internal-tools.map.ts.
 *
 * tools, concurrency, rate limiting, worker availability, worker registration,
 * are all complex topics at different layers, and not explained fully here.
 * this project in the alpha stage and API around the layers are still formining.
 */
export class ResourceManager implements ResourceManagerPort {
  #bus: EventBusPort;
  #jobParser: JobParserPort;

  #internalTools: InternalToolsMap;
  busStopTopics = new Map<string, () => void>();

  messages: RmMessage[] = [];
  isProcessing = false;
  enableSideEffects = true;
  state: RmState;
  handlers: RmEffectHandlerRegistry;

  constructor(deps: ResourceManagerDeps) {
    this.#bus = deps.bus;
    this.#jobParser = deps.jobParser;
    this.#internalTools = internalToolConfig;

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
    };
    this.mapInternalTools();
  }

  mapInternalTools() {
    for (const toolId in this.#internalTools) {
      this.state.registry.tools[toolId] = {
        ...this.#internalTools[toolId],
        hasOnlineWorker: true,
      };
    }
  }

  start() {
    const worker = "worker.profile.submitted";
    const submitted = "job.*.submitted";
    const delayed = "job.*.delayed";
    const queued = "job.*.queued";
    const dequeued = "worker.job.dequeued";
    const completed = "job.*.completed";
    const failed = "job.*.failed";
    const resumed = "job.*.resumed";
    const replay = "replay.mode.submitted";

    this.busStopTopics.set(
      worker,
      this.#bus.subscribe(worker, async (event) =>
        this.handleWorkerProfileSubmitted(event)
      )
    );
    this.busStopTopics.set(
      submitted,
      this.#bus.subscribe(submitted, async (event) =>
        this.handleJobSubmitted(event)
      )
    );

    this.busStopTopics.set(
      delayed,
      this.#bus.subscribe(delayed, async (event) =>
        this.handleJobDelayed(event)
      )
    );
    this.busStopTopics.set(
      resumed,
      this.#bus.subscribe(resumed, async (event) =>
        this.handleJobResumed(event)
      )
    );
    this.busStopTopics.set(
      queued,
      this.#bus.subscribe(queued, async (event) => this.handleJobQueued(event))
    );
    this.busStopTopics.set(
      dequeued,
      this.#bus.subscribe(dequeued, async (event) =>
        this.handleJobDequeued(event)
      )
    );
    this.busStopTopics.set(
      completed,
      this.#bus.subscribe(completed, async (event) =>
        this.handleJobCompletedOrFailed(event)
      )
    );
    this.busStopTopics.set(
      failed,
      this.#bus.subscribe(failed, async (event) =>
        this.handleJobCompletedOrFailed(event)
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

  processAll() {
    if (this.messages.length === 0) return;
    this.isProcessing = true;
    while (this.messages.length > 0) {
      this.processNext();
    }
    this.writeStateToDisk();
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

    // set after in order to supply both to the planner above
    this.state = newState;

    if (!this.enableSideEffects) return;
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

  handleWorkerProfileSubmitted(event: AnyEvent) {
    if (event.type === "worker.profile.submitted") {
      const message: WorkerProfileSubmittedMsg = {
        event: event as AnyEvent<"worker.profile.submitted">,
        type: "WorkerProfileSubmitted",
      };
      this.messages.push(message);
      if (!this.isProcessing) this.processAll();
    }
  }
  handleReplayModeSubmitted(event: AnyEvent) {
    if (event.type !== "replay.mode.submitted") return;
    const e = event as AnyEvent<"replay.mode.submitted">;
    this.enableSideEffects = e.data.enableSideEffects;
  }
  handleJobSubmitted(event: AnyEvent) {
    const parsedEvent = this.#jobParser.parseJobSubmitted(event);
    if (!parsedEvent) return;
    const message: JobSubmittedMsg = {
      type: "JobSubmitted",
      event: parsedEvent,
    };
    this.messages.push(message);
    if (!this.isProcessing) this.processAll();
  }
  handleJobDelayed(event: AnyEvent) {
    const parsedJob = this.#jobParser.parseJobDelayed(event);
    if (!parsedJob) return;
    const message: JobDelayedMsg = {
      type: "JobDelayed",
      event: parsedJob.event,
    };
    this.messages.push(message);
    if (!this.isProcessing) this.processAll();
  }
  handleJobResumed(event: AnyEvent) {
    const jobsResumedEvent = this.#jobParser.parseJobResumed(event);
    if (!jobsResumedEvent) return;
    const message: JobResumedMsg = {
      type: "JobResumed",
      event: jobsResumedEvent,
    };
    this.messages.push(message);
    if (!this.isProcessing) this.processAll();
  }
  handleJobQueued(event: AnyEvent) {
    const parsedJob = this.#jobParser.parseJobQueued(event);
    if (!parsedJob) return;
    const message: JobQueuedMsg = {
      type: "JobQueued",
      event: parsedJob.event,
    };
    this.messages.push(message);
    if (!this.isProcessing) this.processAll();
  }
  handleJobDequeued(event: AnyEvent) {
    if (event.type !== "worker.job.dequeued") return;
    const message: JobDequeuedMsg = {
      type: "JobDequeued",
      event: event as WorkerEvent<"worker.job.dequeued">,
    };
    this.messages.push(message);
    if (!this.isProcessing) this.processAll();
  }
  handleJobCompletedOrFailed(event: AnyEvent) {
    let parsedJob: JobCompletedParsed | JobFailedParsed | undefined;
    if (event.type.endsWith(".completed")) {
      parsedJob = this.#jobParser.parseJobCompleted(event);
    } else if (event.type.endsWith(".failed")) {
      parsedJob = this.#jobParser.parseJobFailed(event);
    }

    if (!parsedJob) return;
    const message: JobFinishedMsg = {
      type: "JobFinished",
      event: parsedJob.event,
    };
    this.messages.push(message);
    if (!this.isProcessing) this.processAll();
  }

  writeStateToDisk() {
    const fileName = `output-rm-runtime.temp.json`;
    const fullPath = path.join(process.cwd(), fileName);
    appendFileSync(fullPath, JSON.stringify(this.state) + "\n", {
      encoding: "utf8",
    });
  }
}

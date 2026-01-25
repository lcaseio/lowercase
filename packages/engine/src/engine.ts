import type {
  EmitterFactoryPort,
  EventBusPort,
  JobParserPort,
} from "@lcase/ports";
import type { EngineDeps } from "@lcase/ports/engine";
import type { AnyEvent, JobCompletedEvent, JobFailedEvent } from "@lcase/types";

import { reducers } from "./registries/reducer.registry.js";
import { planners } from "./registries/planner.registry.js";
import { wireEffectHandlers } from "./registries/effect.registry.js";
import type {
  EffectHandlerRegistry,
  EffectHandlerWrapped,
  EngineEffect,
  EngineMessage,
  EngineState,
  FlowSubmittedMsg,
  JobFinishedMsg,
  Planner,
  Reducer,
  RunFinishedMsg,
  RunStartedMsg,
  WriteContextToDiskFx,
} from "./engine.types.js";
import {
  RunRequestedMsg,
  StepFinishedMsg,
  StepPlannedMsg,
  StepStartedMsg,
} from "./types/message.types.js";
/**
 * Engine class runs flows as the orchestration center.
 * It handles multiple runs in one instance.
 * Each run gets its own context.
 * Passes scoped emitters to handlers for emitting events.
 * Uses a reducer -> planner -> effects structure + internal message queue for
 * deterministic state and logic flows.
 */

export class Engine {
  id = "internal-engine";
  version = "0.1.0-alpha.9";
  state: EngineState = { runs: {}, flows: {} };
  isProcessing = false;
  enableSideEffects = true;

  private queue: EngineMessage[] = [];

  // di
  bus: EventBusPort;
  ef: EmitterFactoryPort;
  jobParser: JobParserPort;
  handlers: EffectHandlerRegistry;

  constructor(private readonly deps: EngineDeps) {
    this.bus = this.deps.bus;
    this.ef = this.deps.ef;
    this.jobParser = this.deps.jobParser;

    this.handlers = wireEffectHandlers({
      ef: this.ef,
      runIndexStore: deps.runIndexStore,
      enqueue: this.enqueue.bind(this),
      processAll: this.processAll.bind(this),
      artifacts: deps.artifacts,
    });
  }

  subscribeToTopics(): void {
    this.bus.subscribe("flow.submitted", async (e: AnyEvent) => {
      const event = e as AnyEvent<"flow.submitted">;
      // TODO: parse enevelope or move this out of engine
      this.handleFlowSubmitted(event);
    });

    this.bus.subscribe("job.*.completed", async (e: AnyEvent) => {
      this.handleJobFinished(e);
    });
    this.bus.subscribe("job.*.failed", async (e: AnyEvent) => {
      this.handleJobFinished(e);
    });
    this.bus.subscribe("replay.mode.submitted", async (e: AnyEvent) =>
      this.handleReplayModeSubmitted(e),
    );
    this.bus.subscribe("step.planned", async (e: AnyEvent) =>
      this.handleStepPlanned(e),
    );
    this.bus.subscribe("step.started", async (e: AnyEvent) =>
      this.handleStepStarted(e),
    );
    this.bus.subscribe("step.reused", async (e: AnyEvent) =>
      this.handleStepFinished(e),
    );
    this.bus.subscribe("step.completed", async (e: AnyEvent) =>
      this.handleStepFinished(e),
    );
    this.bus.subscribe("step.failed", async (e: AnyEvent) =>
      this.handleStepFinished(e),
    );
    this.bus.subscribe("run.requested", async (e: AnyEvent) =>
      this.handleRunRequested(e),
    );
    this.bus.subscribe("run.started", async (e: AnyEvent) =>
      this.handleRunStarted(e),
    );
    this.bus.subscribe("run.completed", async (e: AnyEvent) =>
      this.handleRunFinished(e),
    );
    this.bus.subscribe("run.failed", async (e: AnyEvent) =>
      this.handleRunFinished(e),
    );
  }

  async start() {
    const traceId = this.ef.generateTraceId();
    const spanId = this.ef.generateSpanId();
    const traceParent = this.ef.makeTraceParent(traceId, spanId);
    const emitter = this.ef.newEngineEmitter({
      source: "lowercase://engine/start",
      engineid: this.id,
      traceId,
      spanId,
      traceParent,
    });

    await emitter.emit("engine.started", {
      engine: {
        id: this.id,
        version: this.version,
      },

      status: "started",
    });
    this.subscribeToTopics();
  }

  async stop() {
    const traceId = this.ef.generateTraceId();
    const spanId = this.ef.generateSpanId();
    const traceParent = this.ef.makeTraceParent(traceId, spanId);
    const emitter = this.ef.newEngineEmitter({
      source: "lowercase://engine/stop/",
      engineid: this.id,
      traceId,
      spanId,
      traceParent,
    });

    emitter.emit("engine.stopped", {
      engine: {
        id: this.id,
        version: this.version,
      },
      status: "stopped",
      reason: "SIGINT called",
    });

    await this.bus.close();
  }
  getState(): EngineState {
    return this.state;
  }

  enqueue(message: EngineMessage): void {
    this.queue.push(message);
  }

  executeEffect<T extends EngineEffect["type"]>(
    effect: Extract<EngineEffect, { type: T }>,
  ): void {
    if (!this.enableSideEffects && effect.type !== "WriteContextToDisk") return;

    const handler = this.handlers[effect.type] as EffectHandlerWrapped<T>;
    handler(effect);
  }
  processNext(): void {
    const message = this.queue.shift();
    if (!message) return;

    const reducer = reducers[message.type] as Reducer<
      Extract<EngineMessage, { type: typeof message.type }>
    >;
    const planner = planners[message.type] as Planner<
      Extract<EngineMessage, { type: typeof message.type }>
    >;

    const oldState = this.state;
    let newState = reducer(oldState, message);
    if (newState === undefined) newState = oldState;

    const effects = planner(oldState, newState, message);
    this.state = newState;

    this.executeEffect;
    for (const effect of effects) {
      this.executeEffect(effect);
    }
  }

  processAll(): void {
    this.isProcessing = true;
    while (this.queue.length > 0) {
      this.processNext();
    }
    this.isProcessing = false;
  }

  submitExternal(message: EngineMessage) {
    this.queue.push(message);
    this.processAll();
  }

  handleFlowSubmitted(event: AnyEvent<"flow.submitted">): void {
    if (event.type !== "flow.submitted") return;
    const message: FlowSubmittedMsg = { type: "FlowSubmitted", event };

    this.enqueue(message);
    if (!this.isProcessing) this.processAll();
    return;
  }

  handleJobFinished(event: AnyEvent): void {
    // parse event
    if (!event.type.endsWith(".completed") && !event.type.endsWith(".failed"))
      return;
    // const job = this.jobParser.parseJobCompleted(event);
    // if (!job) throw new Error("[engine] not a job completed event");

    const JobFinishedMsg = {
      type: "JobFinished",
      event: event as JobCompletedEvent | JobFailedEvent,
    } satisfies JobFinishedMsg;

    this.enqueue(JobFinishedMsg);
    if (!this.isProcessing) this.processAll();
  }

  handleReplayModeSubmitted(e: AnyEvent) {
    if (e.type !== "replay.mode.submitted") return;

    // TODO: parse the event
    const event = e as AnyEvent<"replay.mode.submitted">;

    this.enableSideEffects = event.data.enableSideEffects;
  }
  handleStepPlanned(e: AnyEvent): void {
    if (e.type !== "step.planned") return;
    const event = e as AnyEvent<"step.planned">;
    const stepPlannedMsg: StepPlannedMsg = {
      type: "StepPlanned",
      event,
    };
    this.enqueue(stepPlannedMsg);
    if (!this.isProcessing) this.processAll();
  }
  handleStepStarted(e: AnyEvent): void {
    if (e.type !== "step.started") return;
    const event = e as AnyEvent<"step.started">;
    const stepStartedMsg: StepStartedMsg = {
      type: "StepStarted",
      event,
    };
    this.enqueue(stepStartedMsg);
    if (!this.isProcessing) this.processAll();
  }
  handleStepFinished(e: AnyEvent): void {
    if (
      e.type !== "step.completed" &&
      e.type !== "step.failed" &&
      e.type !== "step.reused"
    )
      return;
    const event = e as
      | AnyEvent<"step.completed">
      | AnyEvent<"step.failed">
      | AnyEvent<"step.reused">;
    const stepFinishedMsg: StepFinishedMsg = {
      type: "StepFinished",
      event,
    };
    this.enqueue(stepFinishedMsg);
    if (!this.isProcessing) this.processAll();
  }
  handleRunRequested(e: AnyEvent): void {
    if (e.type !== "run.requested") return;
    console.log("run.requested received");
    const event = e as AnyEvent<"run.requested">;
    const runStartedMsg: RunRequestedMsg = {
      type: "RunRequested",
      event,
    };
    this.enqueue(runStartedMsg);
    if (!this.isProcessing) this.processAll();
  }
  handleRunStarted(e: AnyEvent): void {
    if (e.type !== "run.started") return;
    const event = e as AnyEvent<"run.started">;
    const runStartedMsg: RunStartedMsg = {
      type: "RunStarted",
      event,
    };
    this.enqueue(runStartedMsg);
    if (!this.isProcessing) this.processAll();
  }
  handleRunFinished(e: AnyEvent): void {
    if (e.type !== "run.completed" && e.type !== "run.failed") return;
    const event = e as AnyEvent<"run.completed"> | AnyEvent<"run.failed">;
    const runFinishedMsg: RunFinishedMsg = {
      type: "RunFinished",
      event,
    };
    this.enqueue(runFinishedMsg);
    if (!this.isProcessing) this.processAll();
  }
}

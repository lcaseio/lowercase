import fs from "fs";
import type {
  EmitterFactoryPort,
  EventBusPort,
  JobParserPort,
} from "@lcase/ports";
import type { EngineDeps, EngineTelemetryPort } from "@lcase/ports/engine";
import type {
  AnyEvent,
  CloudScope,
  FlowScope,
  FlowStartedData,
  JobHttpJsonData,
  JobScope,
} from "@lcase/types";
import { FlowDefinition } from "@lcase/types";
import { RunContext } from "@lcase/types/engine";
import { randomUUID } from "crypto";
import { reducers } from "./reducers/reducer-registry.js";
import { planners } from "./planners/planner-registry.js";
import {
  EffectHandlerRegistry,
  wireEffectHandlers,
} from "./handlers/handler-registry.js";
/**
 * Engine class runs flows as the orchestration center.
 * It handles multiple runs in one instance.
 * Each run gets its own context.
 * Passes scoped emitters to handlers for emitting events.
 */

// state
export type EngineState = {
  runs: Record<string, RunContext>;
};
export type Patch = Partial<EngineState>;

// messages
export type FlowSubmittedMsg = {
  type: "FlowSubmitted";
  flowId: string;
  runId: string;
  definition: FlowDefinition;
  meta: {
    traceId: string;
    spanId?: string;
    traceparent?: string;
  };
};

export type StepReadyToStartMsg = {
  type: "StepReadyToStart";
  runId: string;
  stepId: string;
};

export type StartHttjsonStepMsg = {
  type: "StartHttpjsonStep";
  runId: string;
  stepId: string;
};

export type JobCompletedMsg = {
  type: "JobCompleted";
  runId: string;
  stepId: string;
};

export type EngineMessage =
  | FlowSubmittedMsg
  | StepReadyToStartMsg
  | StartHttjsonStepMsg
  | JobCompletedMsg;

export type MessageType = EngineMessage["type"];

// effects
export type EmitEventFx = {
  kind: "EmitEvent";
  eventType: string;
  data: unknown;
};
export type EmitFlowStartedFx = {
  kind: "EmitFlowStartedEvent";
  eventType: "flow.started";
  scope: FlowScope & CloudScope;
  data: FlowStartedData;
  traceId: string;
};
export type EmitJobHttpjsonSubmittedFx = {
  kind: "EmitJobHttpjsonSubmittedEvent";
  eventType: "job.httpjson.submitted";
  scope: JobScope & CloudScope;
  data: JobHttpJsonData;
  traceId: string;
};
export type DispatchInternalFx = {
  kind: "DispatchInternal";
  message: EngineMessage;
};

export type EngineEffect =
  | EmitEventFx
  | DispatchInternalFx
  | EmitFlowStartedFx
  | EmitJobHttpjsonSubmittedFx;

// reducers
export type Reducer<M extends EngineMessage = EngineMessage> = (
  state: EngineState,
  message: M
) => Patch | void;
export type Planner<M extends EngineMessage = EngineMessage> = (args: {
  oldState: EngineState;
  newState: EngineState;
  message: M;
}) => EngineEffect[] | void;

// handlers
export type EffectHandler<K extends EngineEffect["kind"]> = (
  effect: Extract<EngineEffect, { kind: K }>
) => void | Promise<void>;

export class Engine {
  id = "internal-engine";
  version = "0.1.0-alpha.7";
  state: EngineState = { runs: {} };
  isProcessing = false;

  private queue: EngineMessage[] = [];

  // di
  bus: EventBusPort;
  ef: EmitterFactoryPort;
  tel: EngineTelemetryPort;
  jobParser: JobParserPort;
  handlers: EffectHandlerRegistry;

  constructor(private readonly deps: EngineDeps) {
    this.bus = this.deps.bus;
    this.ef = this.deps.ef;
    this.tel = this.deps.tel;
    this.jobParser = this.deps.jobParser;

    this.handlers = wireEffectHandlers(this.ef);
  }

  subscribeToTopics(): void {
    this.bus.subscribe("flow.submitted", async (e: AnyEvent) => {
      const event = e as AnyEvent<"flow.submitted">;
      // const parsedFlowQueued = this.flowParser.flowQueued(event);
      // if (parsedFlowQueued.error) {
      //   await this.tel.flowQueuedFailed(parsedFlowQueued);
      //   return;
      // }

      this.startFlow(event);
    });

    this.bus.subscribe("job.*.completed", async (e: AnyEvent) => {
      await this.handleJobCompleted(e);
    });
    this.bus.subscribe("job.*.failed", async (e: AnyEvent) => {
      await this.handleJobFailed(e);
    });
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

  executeEffect(effect: EngineEffect): void {
    if (effect.kind === "DispatchInternal") {
      this.queue.push(effect.message);
      return;
    }

    // TODO: fix `any` here
    const handler = this.handlers[effect.kind] as
      | EffectHandler<any>
      | undefined;
    if (!handler) return;

    handler(effect);
  }
  processNext(): void {
    const message = this.queue.shift();
    if (!message) return;

    const reducer = reducers[message.type] as Reducer | undefined;
    const planner = planners[message.type] ?? [];

    const oldState = this.state;
    const patch = reducer ? reducer({ ...oldState }, message) : undefined;

    const newState =
      patch && Object.keys(patch).length > 0
        ? {
            ...oldState,
            ...patch,
          }
        : oldState;

    this.state = newState;

    const allEffects: EngineEffect[] = [];

    // TODO: fix `any` here
    const effects = planner({ oldState, newState, message } as any) ?? [];

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

  startFlow(event: AnyEvent<"flow.submitted">): void {
    const message: FlowSubmittedMsg = {
      type: "FlowSubmitted",
      flowId: event.data.flow.id,
      runId: String(randomUUID()),
      definition: event.data.definition,
      meta: {
        traceId: event.traceid,
      },
    };

    this.enqueue(message);
    if (!this.isProcessing) this.processAll();
    return;
  }

  async handleJobFailed(event: AnyEvent): Promise<void> {
    const job = this.jobParser.parseJobFailed(event);
    if (!job) throw new Error("[engine] not a job failed event");
  }

  async handleJobCompleted(event: AnyEvent): Promise<void> {
    // parse event
    const job = this.jobParser.parseJobCompleted(event);
    if (!job) throw new Error("[engine] not a job completed event");

    const jobCompletedMsg = {
      type: "JobCompleted",
      runId: job.event.runid,
      stepId: job.event.stepid,
    } satisfies JobCompletedMsg;

    this.enqueue(jobCompletedMsg);
    if (this.isProcessing === false) this.processAll();
    return;
  }

  writeRunContext(runId: string): void {
    const context = this.state.runs[runId];
    const file = "./output.temp.json";

    fs.writeFileSync(file, JSON.stringify(context, null, 2));

    const logEmitter = this.ef.newSystemEmitter({
      source: "lowercase://engine/write-run-context",
      traceId: "",
      spanId: "",
      traceParent: "",
    });
    logEmitter.emit("system.logged", {
      log: `[engine] context written to disk at ${file}`,
    });
    return;
  }
}

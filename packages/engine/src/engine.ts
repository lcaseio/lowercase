import fs from "fs";
import type {
  EmitterFactoryPort,
  EventBusPort,
  JobParserPort,
} from "@lcase/ports";
import type { EngineDeps, EngineTelemetryPort } from "@lcase/ports/engine";
import type { AnyEvent } from "@lcase/types";
import { randomUUID } from "crypto";
import { reducers } from "./reducers/reducer-registry.js";
import { planners } from "./planners/planner-registry.js";
import {
  EffectHandlerRegistry,
  wireEffectHandlers,
} from "./handlers/handler-registry.js";
import {
  EffectHandler,
  EngineEffect,
  EngineMessage,
  EngineState,
  FlowSubmittedMsg,
  JobCompletedMsg,
  JobFailedMsg,
  Reducer,
} from "./engine.types.js";
/**
 * Engine class runs flows as the orchestration center.
 * It handles multiple runs in one instance.
 * Each run gets its own context.
 * Passes scoped emitters to handlers for emitting events.
 */

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
      // TODO: parse enevelope or move this out of engine
      this.handleFlowSubmitted(event);
    });

    this.bus.subscribe("job.*.completed", async (e: AnyEvent) => {
      // TODO: parse evenvelope
      this.handleJobCompleted(e);
    });
    this.bus.subscribe("job.*.failed", async (e: AnyEvent) => {
      // TODO: parse evenvelope
      this.handleJobFailed(e);
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

  handleFlowSubmitted(event: AnyEvent<"flow.submitted">): void {
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

  handleJobFailed(event: AnyEvent): void {
    const job = this.jobParser.parseJobFailed(event);
    if (!job) throw new Error("[engine] not a job failed event");
    const jobFailedMsg = {
      type: "JobFailed",
      runId: job.event.runid,
      stepId: job.event.stepid,
      reason: job.event.data.reason,
    } satisfies JobFailedMsg;

    this.enqueue(jobFailedMsg);
    if (!this.isProcessing) this.processAll();
    return;
  }

  handleJobCompleted(event: AnyEvent): void {
    // parse event
    const job = this.jobParser.parseJobCompleted(event);
    if (!job) throw new Error("[engine] not a job completed event");

    const jobCompletedMsg = {
      type: "JobCompleted",
      runId: job.event.runid,
      stepId: job.event.stepid,
    } satisfies JobCompletedMsg;

    this.enqueue(jobCompletedMsg);
    if (!this.isProcessing) this.processAll();
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

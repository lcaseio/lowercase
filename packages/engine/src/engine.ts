import fs from "fs";
import type {
  EmitterFactoryPort,
  EventBusPort,
  FlowParserPort,
  JobParserPort,
} from "@lcase/ports";
import type {
  EngineDeps,
  EngineTelemetryPort,
  StepHandlerRegistryPort,
  RunOrchestratorPort,
  StepRunnerPort,
  FlowRouterPort,
} from "@lcase/ports/engine";
import type {
  AnyEvent,
  CloudScope,
  FlowScope,
  FlowStartedData,
  JobCompletedEvent,
  JobFailedEvent,
  JobHttpJsonData,
  JobScope,
} from "@lcase/types";
import { CapId, FlowDefinition } from "@lcase/types";
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

export type MessageType = EngineMessage["type"];
export type EngineMessage =
  | FlowSubmittedMsg
  | StepReadyToStartMsg
  | StartHttjsonStepMsg;

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
  #runs = new Map<string, RunContext>();
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

  async subscribeToTopics(): Promise<void> {
    this.bus.subscribe("flow.submitted", async (e: AnyEvent) => {
      const event = e as AnyEvent<"flow.submitted">;
      // const parsedFlowQueued = this.flowParser.flowQueued(event);
      // if (parsedFlowQueued.error) {
      //   await this.tel.flowQueuedFailed(parsedFlowQueued);
      //   return;
      // }

      await this.startFlow(event);
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

    emitter.emit("engine.started", {
      engine: {
        id: this.id,
        version: this.version,
      },
      status: "started",
    });
    await this.subscribeToTopics();
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

  async startFlow(event: AnyEvent<"flow.submitted">): Promise<void> {
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

  /**
   * Queues a step, and steps it pipes data to.
   * If further steps also pipe, their to targets are queued too.
   * @param flow Flow definition
   * @param context RunContext
   * @param stepName name of first step
   */
  async startStreamingSteps(
    flow: FlowDefinition,
    context: RunContext,
    stepName: string
  ): Promise<void> {
    while (true) {
      context = this.#initStepContext(context, stepName);
      if (!context.steps[stepName]) return;
      await this.startStep(flow, context, stepName);
      const pipeToStep = flow.steps[stepName].pipe?.to?.step;
      if (pipeToStep) {
        stepName = pipeToStep;
      } else {
        break;
      }
    }
  }
  // queues a single step vs multiple
  async startStep(
    flow: FlowDefinition,
    context: RunContext,
    stepName: string
  ): Promise<void> {
    const stepType = flow.steps[stepName].type;

    const flowid = context.flowName;
    const runid = context.runId;
    const stepid = stepName;
    const steptype = stepType;

    const stepEmitter = this.ef.newStepEmitterNewSpan(
      {
        source: "lowercase://engine/start-step",
        flowid,
        runid,
        stepid,
        steptype,
      },
      context.traceId
    );
    stepEmitter.emit("step.started", {
      step: {
        id: stepName,
        name: stepName,
        type: stepType,
      },
      status: "started",
    });

    const jobId = String(crypto.randomUUID());
    const jobEmitter = this.ef.newJobEmitterNewSpan(
      {
        source: "lowercase://engine/queue-step",
        flowid,
        runid,
        stepid,
        jobid: jobId,
        capid: stepType as CapId,
        toolid: null,
      },
      context.traceId
    );

    // const handler = this.stepHandlerRegistry[stepType as CapId];
    // await handler.handle(flow, context, stepName, jobEmitter);

    context.queuedSteps.add(stepName);
    context.outstandingSteps++;
    this.#runs.set(context.runId, context);
  }

  #initStepContext(context: RunContext, stepName: string): RunContext {
    context.steps[stepName] = {
      attempt: 0,
      exports: {},
      pipe: {},
      result: {},
      status: "idle",
      stepId: stepName,
    };
    return context;
  }

  #getNextStepName(
    flow: FlowDefinition,
    context: RunContext,
    currentStep: string
  ): string | undefined {
    const status = context.steps[currentStep].status as "success" | "failure";
    const nextStepName = flow.steps[currentStep].on?.[status];
    return nextStepName;
  }

  async handleJobFailed(event: AnyEvent): Promise<void> {
    const job = this.jobParser.parseJobFailed(event);
    if (!job) throw new Error("[engine] not a job failed event");

    const e = job.event;

    this.isValidRunId(e.runid);
    const context = this.#runs.get(e.runid)!;

    context.steps[e.stepid].result = e.data.result ?? {};
    context.steps[e.stepid].status = e.data.status;

    const flow = context.definition;

    this.markStepAsFailed(e, context);
    this.markStepAsDone(e.runid, context);
    this.writeRunContext(e.runid);

    const nextStep = this.#getNextStepName(flow, context, e.stepid);

    if (nextStep) {
      this.startStreamingSteps(flow, context, nextStep);
    } else if (context.outstandingSteps === 0) {
      this.markRunAsFailed(e, context);
      return;
    }
  }

  isValidRunId(runId: string) {
    if (this.state.runs[runId] !== undefined) return true;
    throw new Error(`[engine] invalid run id ${runId}`);
  }

  markStepAsDone(stepId: string, run: RunContext) {
    run.queuedSteps.delete(stepId);
    run.runningSteps.delete(stepId);
    run.doneSteps.add(stepId);
    run.outstandingSteps--;
  }

  async handleJobCompleted(event: AnyEvent): Promise<void> {
    // parse event
    const job = this.jobParser.parseJobCompleted(event);
    if (!job) throw new Error("[engine] not a job completed event");

    const e = job.event;

    this.isValidRunId(e.runid);
    const context = this.#runs.get(e.runid)!;

    context.steps[e.stepid].result = e.data.result ?? {};
    context.steps[e.stepid].status = e.data.status;

    const flow = context.definition;

    this.markStepAsCompleted(e, context);
    this.markStepAsDone(e.runid, context);
    this.writeRunContext(e.runid);

    const nextStep = this.#getNextStepName(flow, context, e.stepid);

    if (nextStep) {
      this.startStreamingSteps(flow, context, nextStep);
    } else if (context.outstandingSteps === 0) {
      this.markRunAsCompleted(e, context);
      return;
    }
  }

  async markStepAsCompleted(e: JobCompletedEvent, run: RunContext) {
    const stepEmitter = this.ef.newStepEmitterFromJobEvent(
      e,
      "lowercase://engine/handle-worker-done"
    );
    stepEmitter.emit("step.completed", {
      step: {
        id: e.stepid,
        name: e.stepid,
        type: run.definition.steps[e.stepid].type,
      },
      status: "success",
    });
    run.steps[e.stepid].status = e.data.status;
  }

  async markStepAsFailed(e: JobFailedEvent, run: RunContext) {
    const stepEmitter = this.ef.newStepEmitterFromJobEvent(
      e,
      "lowercase://engine/handle-worker-done"
    );
    await stepEmitter.emit("step.failed", {
      step: {
        id: e.stepid,
        name: e.stepid,
        type: run.definition.steps[e.stepid].type,
      },
      status: "failure",
      reason: e.data.reason,
    });
    run.steps[e.stepid].status = e.data.status;
  }

  async markRunAsCompleted(event: JobCompletedEvent, run: RunContext) {
    const runEmitter = this.ef.newRunEmitterFromEvent(
      event,
      "lowercase://engine/mark-run-as-completed"
    );
    const e = await runEmitter.emit("run.completed", {
      run: {
        id: event.runid,
        status: event.data.status,
      },
      engine: {
        id: this.id,
      },
      status: "success",
      message: "run completed",
    });

    const flowEmitter = this.ef.newFlowEmitterNewSpan(
      {
        source: "lowercase://engine/mark-run-as-done",
        flowid: e.flowid,
      },
      e.traceid
    );
    await flowEmitter.emit("flow.completed", {
      flow: {
        id: e.flowid,
        name: run.definition.name,
        version: run.definition.version,
      },
      status: "success",
    });
    run.status = "completed";
  }

  async markRunAsFailed(event: JobFailedEvent, run: RunContext) {
    const runEmitter = this.ef.newRunEmitterFromEvent(
      event,
      "lowercase://engine/mark-run-as-completed"
    );
    const e = await runEmitter.emit("run.failed", {
      run: {
        id: event.runid,
        status: event.data.status,
      },
      engine: {
        id: this.id,
      },
      status: "failure",
      message: "run completed",
    });

    const flowEmitter = this.ef.newFlowEmitterNewSpan(
      {
        source: "lowercase://engine/mark-run-as-done",
        flowid: e.flowid,
      },
      e.traceid
    );
    await flowEmitter.emit("flow.failed", {
      flow: {
        id: e.flowid,
        name: run.definition.name,
        version: run.definition.version,
      },
      status: "failure",
    });
    run.status = "failed";
  }

  writeRunContext(runId: string): void {
    const context = this.#runs.get(runId);
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

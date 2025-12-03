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
import type { AnyEvent, JobCompletedEvent, JobFailedEvent } from "@lcase/types";
import { CapId, FlowDefinition } from "@lcase/types";
import { RunContext } from "@lcase/types/engine";
import { randomUUID } from "crypto";

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
export type FlowSubmitted = {
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

export type StartStep = {
  type: "StartStep";
  runId: string;
  stepId: string;
};
export type EngineMessage = FlowSubmitted | StartStep;

// effects
export type EmitEventEffect = {
  kind: "EmitEvent";
  eventType: string;
  payload: unknown;
};
export type DispatchInternalEffect = {
  kind: "DispatchInternal";
  message: EngineMessage;
};

export type EngineEffect = EmitEventEffect | DispatchInternalEffect;

// reducers
export type Reducer<M extends EngineMessage = EngineMessage> = (
  state: EngineState,
  message: M
) => Patch | void;
export type EffectPlanner<M extends EngineMessage = EngineMessage> = (args: {
  oldState: EngineState;
  newState: EngineState;
  message: M;
}) => EngineEffect[] | void;

export class Engine {
  #runs = new Map<string, RunContext>();
  id = "internal-engine";
  version = "0.1.0-alpha.7";

  private queue: EngineMessage[] = [];

  // di
  bus: EventBusPort;
  ef: EmitterFactoryPort;
  tel: EngineTelemetryPort;
  flowParser: FlowParserPort;
  jobParser: JobParserPort;
  stepHandlerRegistry: StepHandlerRegistryPort;
  stepRunner: StepRunnerPort;
  runOrchestrator: RunOrchestratorPort;
  flowRouter: FlowRouterPort;

  constructor(private readonly deps: EngineDeps) {
    this.bus = this.deps.bus;
    this.ef = this.deps.ef;
    this.tel = this.deps.tel;
    this.jobParser = this.deps.jobParser;
    this.stepHandlerRegistry = this.deps.stepHandlerRegistry;
    this.stepRunner = this.deps.stepRunner;
    this.runOrchestrator = this.deps.runOrchestrator;
    this.flowParser = this.deps.flowParser;
    this.flowRouter = this.deps.flowRouter;
  }

  async subscribeToTopics(): Promise<void> {
    this.bus.subscribe("flow.submitted", async (e: AnyEvent) => {
      const event = e as AnyEvent<"flow.submitted">;
      const parsedFlowQueued = this.flowParser.flowQueued(event);
      if (parsedFlowQueued.error) {
        await this.tel.flowQueuedFailed(parsedFlowQueued);
        return;
      }

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

  enqueue(message: EngineMessage): void {
    this.queue.push(message);
  }

  async startFlow(event: AnyEvent<"flow.submitted">): Promise<void> {
    const message: FlowSubmitted = {
      type: "FlowSubmitted",
      flowId: event.data.flow.id,
      runId: String(randomUUID()),
      definition: event.data.definition,
      meta: {
        traceId: event.traceid,
      },
    };

    this.enqueue(message);

    await this.tel.flowStarted(event);

    const flow = event.data.definition as FlowDefinition; // extract to parse helper

    const context = this.#buildRunContext(event);

    await this.tel.runStarted(context);

    await this.flowRouter.startFlow(context);

    // await this.runOrchestrator.getNext(context);

    /**
     * this.runOrchestrator.getNext()
     *
     * const stepIds = this.runOrchestrator.startRun() ?? undefined
     * const b = a ?? this.runner.run(runCtx, stepId)
     *
     */

    /** */

    // await this.startStreamingSteps(flow, context, flow.start);
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

    const handler = this.stepHandlerRegistry[stepType as CapId];
    await handler.handle(flow, context, stepName, jobEmitter);

    context.queuedSteps.add(stepName);
    context.outstandingSteps++;
    this.#runs.set(context.runId, context);
  }
  #buildRunContext(event: AnyEvent<"flow.submitted">): RunContext {
    const context: RunContext = {
      definition: event.data.definition as FlowDefinition,
      flowId: event.data.flow.id,
      runId: String(crypto.randomUUID()),
      traceId: event.traceid,
      // step state stuff
      runningSteps: new Set(),
      queuedSteps: new Set(),
      doneSteps: new Set(),
      outstandingSteps: 0,

      flowName: event.data.flow.id,
      status: "started",
      globals: {},
      exports: {},
      inputs: {},
      steps: {},
    };
    return context;
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
    if (this.#runs.has(runId)) return true;
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

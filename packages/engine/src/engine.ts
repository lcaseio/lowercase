import fs from "fs";
import type { RunContext, Flow } from "@lcase/specs";
import type {
  EmitterFactoryPort,
  EventBusPort,
  JobParserPort,
  StreamRegistryPort,
} from "@lcase/ports";
import type { AnyEvent, JobCompletedEvent, JobFailedEvent } from "@lcase/types";
import { FlowStore } from "@lcase/adapters/flow-store";
import type { StepHandlerRegistry } from "./step-handler.registry.js";
import { CapId } from "@lcase/types";

/**
 * Engine class runs flows as the orchestration center.
 * It handles multiple runs in one instance.
 * Each run gets its own context.
 * Passes scoped emitters to handlers for emitting events.
 */
export class Engine {
  #runs = new Map<string, RunContext>();
  id = "internal-engine";
  version = "0.1.0-alpha.7";

  constructor(
    private readonly flowDb: FlowStore,
    private readonly bus: EventBusPort,
    private readonly streamRegistry: StreamRegistryPort,
    private readonly stepHandlerRegistry: StepHandlerRegistry,
    private readonly ef: EmitterFactoryPort,
    private readonly jobParser: JobParserPort
  ) {}

  async subscribeToTopics(): Promise<void> {
    this.bus.subscribe("flow.queued", async (e: AnyEvent) => {
      if (e.type === "flow.queued") {
        const event = e as AnyEvent<"flow.queued">;

        const spanId = this.ef.generateSpanId();
        const traceParent = this.ef.makeTraceParent(event.traceid, spanId);
        const flowEmitter = this.ef.newFlowEmitter({
          source: "lowercase://engine/flow/queued",
          flowid: event.flowid,
          traceId: event.traceid,
          spanId,
          traceParent,
        });

        flowEmitter.emit("flow.started", {
          flow: {
            id: event.flowid,
            name: event.data.flow.name,
            version: event.data.flow.version,
          },
        });

        await this.startFlow(event);
      }
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

  async startFlow(event: AnyEvent<"flow.queued">): Promise<void> {
    /**
     * casting as flow now because the specs package cannot be
     * imported into @lcase/types.
     * this will change when flow definitions are moved to the
     * types package, and specs is a home for schemas
     */
    const flow = event.data.definition as Flow;
    let context = this.#buildRunContext(event);
    context = this.#initStepContext(context, flow.start);

    const systemSpanId = this.ef.generateSpanId();
    const systemTraceParent = this.ef.makeTraceParent(
      event.traceid,
      systemSpanId
    );
    const logEmitter = this.ef.newSystemEmitter({
      source: "lowercase://engine/start-flow",
      traceId: event.traceid,
      spanId: systemSpanId,
      traceParent: systemTraceParent,
    });
    await logEmitter.emit("system.logged", {
      log: "[engine] made RunContext",
    });

    const spanId = this.ef.generateSpanId();
    const traceParent = this.ef.makeTraceParent(event.traceid, spanId);
    const emitter = this.ef.newRunEmitter({
      source: "lowercase://engine/start-flow",
      flowid: flow.name,
      runid: context.runId,
      traceId: event.traceid,
      spanId,
      traceParent,
    });

    emitter.emit("run.started", {
      run: {
        id: context.runId,
        status: "started",
      },
      engine: {
        id: "default-engine",
      },
      status: "started",
    });
    await this.startStreamingSteps(flow, context, flow.start);
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
    flow: Flow,
    context: RunContext,
    stepName: string
  ): Promise<void> {
    while (true) {
      context = this.#initStepContext(context, stepName);
      await this.startStep(flow, context, stepName);
      const pipeToStep = flow.steps[stepName].pipe?.to?.step;
      if (context.steps[stepName].pipe.to && pipeToStep) {
        stepName = pipeToStep;
      } else {
        break;
      }
    }
  }
  // queues a single step vs multiple
  async startStep(
    flow: Flow,
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

    const handler = this.stepHandlerRegistry[stepType];
    await handler.queue(flow, context, stepName, jobEmitter);

    context.queuedSteps.add(stepName);
    context.outstandingSteps++;
    this.#runs.set(context.runId, context);
  }
  #buildRunContext(event: AnyEvent<"flow.queued">): RunContext {
    const context: RunContext = {
      definition: event.data.definition as Flow,
      flowId: event.data.flow.id,
      runId: event.data.test ? "test-run-id" : String(crypto.randomUUID()),
      traceId: event.traceid,
      // step state stuff
      runningSteps: new Set(),
      queuedSteps: new Set(),
      doneSteps: new Set(),
      stepStatusCounts: {},
      outstandingSteps: 0,

      // test stuff
      test: event.data.test,
      outFile: event.data.outfile,

      flowName: event.data.flowName,
      status: "running",
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
    };
    return context;
  }

  #getNextStepName(
    flow: Flow,
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
    run.status = "success";
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
    run.status = "success";
  }

  writeRunContext(runId: string): void {
    const context = this.#runs.get(runId);
    const file =
      context?.outFile !== undefined ? context.outFile : "./output.temp.json";

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

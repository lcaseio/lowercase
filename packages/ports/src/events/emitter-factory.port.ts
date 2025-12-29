import type {
  AllJobEvents,
  AnyEvent,
  CloudScope,
  ConcurrencyScope,
  EngineScope,
  FlowScope,
  JobCompletedEvent,
  JobEventType,
  JobFailedEvent,
  JobScope,
  ReplayScope,
  RunScope,
  SchedulerScope,
  StepScope,
  SystemScope,
  ToolScope,
  WorkerScope,
} from "@lcase/types";
import type {
  EngineEmitterPort,
  FlowEmitterPort,
  JobEmitterPort,
  ReplayEmitterPort,
  RunEmitterPort,
  StepEmitterPort,
  SystemEmitterPort,
  ToolEmitterPort,
  WorkerEmitterPort,
  SchedulerEmitterPort,
  ConcurrencyEmitterPort,
} from "./emitters.port.js";

export type OtelContext = {
  traceId: string;
  spanId: string;
  traceParent: string;
  parentSpanId?: string;
};

export interface EmitterFactoryPort {
  newConcurrencyEmitterFromEvent(
    event: AnyEvent,
    scope: ConcurrencyScope & { source: string }
  ): ConcurrencyEmitterPort;
  newConcurrencyEmitterNewTrace(
    scope: ConcurrencyScope & CloudScope,
    traceId: string
  ): ConcurrencyEmitterPort;

  newSchedulerEmitterNewSpan(
    scope: CloudScope & SchedulerScope,
    traceId: string
  ): SchedulerEmitterPort;
  newSchedulerEmitterFromEvent(
    event: AnyEvent,
    scope: SchedulerScope & { source: string }
  ): SchedulerEmitterPort;

  newSchedulerEmitterNewSpan(
    scope: CloudScope & SchedulerScope,
    traceId: string
  ): SchedulerEmitterPort;

  newReplayEmitterNewTrace(
    scope: CloudScope & ReplayScope,
    internal?: boolean
  ): ReplayEmitterPort;
  newSystemEmitter(
    scope: CloudScope & SystemScope & OtelContext
  ): SystemEmitterPort;
  newSystemEmitterNewSpan(
    scope: CloudScope & SystemScope,
    traceId: string
  ): SystemEmitterPort;

  newJobEmitter(scope: CloudScope & JobScope & OtelContext): JobEmitterPort;
  newJobEmitterNewSpan(
    scope: CloudScope & JobScope,
    traceId: string
  ): JobEmitterPort;
  newJobEmitterFromEvent(event: AllJobEvents, source: string): JobEmitterPort;

  newWorkerEmitterNewSpan(
    scope: CloudScope & WorkerScope,
    traceId: string
  ): WorkerEmitterPort;
  newWorkerEmitterNewTrace(scope: CloudScope & WorkerScope): WorkerEmitterPort;

  /* Tool */
  newToolEmitterNewSpan(
    scope: CloudScope & ToolScope,
    traceId: string
  ): ToolEmitterPort;
  newToolEmitterFromEvent(
    event: AnyEvent<JobEventType>,
    source: string
  ): ToolEmitterPort;

  newStepEmitter(scope: CloudScope & StepScope & OtelContext): StepEmitterPort;
  newStepEmitterFromJobEvent(
    event: AnyEvent<JobEventType>,
    source: string
  ): StepEmitterPort;
  newStepEmitterNewSpan(
    scope: CloudScope & StepScope,
    traceId: string
  ): StepEmitterPort;

  newEngineEmitter(
    scope: CloudScope & EngineScope & OtelContext
  ): EngineEmitterPort;

  newFlowEmitter(scope: CloudScope & FlowScope & OtelContext): FlowEmitterPort;
  newFlowEmitterNewSpan(
    scope: CloudScope & FlowScope,
    traceId: string
  ): FlowEmitterPort;
  newRunEmitter(scope: CloudScope & RunScope & OtelContext): RunEmitterPort;
  newRunEmitterNewSpan(
    scope: CloudScope & RunScope & { traceid: string }
  ): RunEmitterPort;
  newRunEmitterFromEvent(
    event: JobCompletedEvent | JobFailedEvent,
    source: string
  ): RunEmitterPort;

  generateTraceId(): string;
  generateSpanId(): string;
  makeTraceParent(traceId: string, spanId: string): string;
}

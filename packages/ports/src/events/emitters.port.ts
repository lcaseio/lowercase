import type {
  CloudScope,
  SystemEventType,
  SystemEventData,
  JobEventType,
  JobEventData,
  WorkerEventType,
  WorkerEventData,
  ToolEventType,
  ToolEventData,
  JobEvent,
  StepEventType,
  StepEventData,
  EngineEventType,
  EngineEventData,
  EngineEvent,
  FlowEventData,
  FlowEventType,
  FlowEvent,
  RunEventType,
  RunEventData,
  RunEvent,
  ToolEvent,
  ReplayEventType,
  ReplayEventData,
  ReplayEvent,
  SchedulerEventType,
  SchedulerEvent,
  SchedulerEventData,
  ConcurrencyEventType,
  ConcurrencyEventData,
  ConcurrencyEvent,
} from "@lcase/types";

export interface BaseEmitterPort {}

export type EnvelopeHeader = {
  id: string;
  time: string;
  specversion: "1.0";
  traceparent: string;
  traceid: string;
  spanid: string;
  parentspanid?: string;
} & CloudScope;

export interface StepEmitterPort {
  emit<T extends StepEventType>(type: T, data: StepEventData<T>): Promise<void>;
}

export interface SystemEmitterPort {
  emit<T extends SystemEventType>(
    type: T,
    data: SystemEventData<T>
  ): Promise<void>;
}

export interface ReplayEmitterPort {
  emit<T extends ReplayEventType>(
    type: T,
    data: ReplayEventData<T>
  ): Promise<ReplayEvent<T>>;
}

export interface JobEmitterPort {
  emit<T extends JobEventType>(
    type: T,
    data: JobEventData<T>
  ): Promise<JobEvent<T>>;
  formEvent<T extends JobEventType>(
    type: T,
    data: JobEventData<T>
  ): JobEvent<T>;
  emitFormedEvent(event: JobEvent): Promise<JobEvent>;
}

export interface EngineEmitterPort {
  emit<T extends EngineEventType>(
    type: T,
    data: EngineEventData<T>
  ): Promise<EngineEvent<T>>;
}

export interface FlowEmitterPort {
  emit<T extends FlowEventType>(
    type: T,
    data: FlowEventData<T>
  ): Promise<FlowEvent<T>>;
}

export interface RunEmitterPort {
  emit<T extends RunEventType>(
    type: T,
    data: RunEventData<T>
  ): Promise<RunEvent<T>>;
}

export interface WorkerEmitterPort {
  emit<T extends WorkerEventType>(
    type: T,
    data: WorkerEventData<T>
  ): Promise<void>;
}

export interface ToolEmitterPort {
  emit<T extends ToolEventType>(
    type: T,
    data: ToolEventData<T>
  ): Promise<ToolEvent<T>>;
}

export interface SchedulerEmitterPort {
  emit<T extends SchedulerEventType>(
    type: T,
    data: SchedulerEventData<T>
  ): Promise<SchedulerEvent<T>>;
}

export interface ConcurrencyEmitterPort {
  emit<T extends ConcurrencyEventType>(
    type: T,
    data: ConcurrencyEventData<T>
  ): Promise<ConcurrencyEvent<T>>;
}

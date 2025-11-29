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
} from "@lcase/types";
export type EnvelopeHeader = {
  id: string;
  time: string;
  specversion: "1.0";
  traceparent: string;
  traceid: string;
  spanid: string;
  parentspanid?: string;
} & CloudScope;

export interface BaseEmitterPort {}

export interface StepEmitterPort {
  emit<T extends StepEventType>(type: T, data: StepEventData<T>): Promise<void>;
}

export interface SystemEmitterPort {
  emit<T extends SystemEventType>(
    type: T,
    data: SystemEventData<T>
  ): Promise<void>;
}

export interface JobEmitterPort {
  emit<T extends JobEventType>(
    type: T,
    data: JobEventData<T>
  ): Promise<JobEvent<T>>;
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
  emit<T extends ToolEventType>(type: T, data: ToolEventData<T>): Promise<void>;
}

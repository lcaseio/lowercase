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

export interface WorkerEmitterPort {
  emit<T extends WorkerEventType>(
    type: T,
    data: WorkerEventData<T>
  ): Promise<void>;
}

export interface ToolEmitterPort {
  emit<T extends ToolEventType>(type: T, data: ToolEventData<T>): Promise<void>;
}

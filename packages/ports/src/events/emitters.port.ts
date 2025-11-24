import type {
  CloudScope,
  SystemEventType,
  SystemEventData,
  JobEventType,
  JobEventData,
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
  emit<T extends JobEventType>(type: T, data: JobEventData<T>): Promise<void>;
}

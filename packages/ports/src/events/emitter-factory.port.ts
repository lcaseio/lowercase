import {
  AllJobEvents,
  CloudScope,
  JobScope,
  SystemScope,
  ToolScope,
  WorkerScope,
} from "@lcase/types";
import {
  JobEmitterPort,
  SystemEmitterPort,
  ToolEmitterPort,
  WorkerEmitterPort,
} from "./emitters.port.js";

export type OtelContext = {
  traceId: string;
  spanId: string;
  traceParent: string;
  parentSpanId?: string;
};

export interface EmitterFactoryPort {
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

  newToolEmitterNewSpan(
    scope: CloudScope & ToolScope,
    traceId: string
  ): ToolEmitterPort;
}

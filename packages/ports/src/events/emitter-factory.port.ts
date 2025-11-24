import { AllJobEvents, CloudScope, JobScope, SystemScope } from "@lcase/types";
import { JobEmitterPort, SystemEmitterPort } from "./emitters.port.js";

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
  newJobEmitter(scope: CloudScope & JobScope & OtelContext): JobEmitterPort;
  newJobEmitterNewSpan(
    scope: CloudScope & JobScope,
    traceId: string
  ): JobEmitterPort;
  newJobEmitterFromEvent(event: AllJobEvents, source: string): JobEmitterPort;
}

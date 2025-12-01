import type { JobEmitterPort } from "@lcase/ports";
import type { FlowDefinition } from "@lcase/types";
import type { RunContext } from "@lcase/types/engine";

export interface StepHandler {
  queue(
    flow: FlowDefinition,
    context: RunContext,
    stepName: string,
    emitter: JobEmitterPort
  ): Promise<void>;
}

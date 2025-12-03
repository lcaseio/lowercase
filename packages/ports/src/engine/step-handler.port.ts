import { FlowDefinition } from "@lcase/types";
import { RunContext, StepContext } from "@lcase/types/engine";
import { JobEmitterPort } from "../events/emitters.port.js";
import { StepOutcome } from "../engine.port.js";

export type StepHandlerOutput = {};
export interface StepHandlerPort {
  handle(
    flow: FlowDefinition,
    context: RunContext,
    stepName: string,
    emitter: JobEmitterPort
  ): Promise<void>;
  handleNew(
    runCtx: RunContext,
    stepCtx: StepContext,
    stepId: string
  ): Promise<StepOutcome>;
}
export type StepHandlerRegistryPort = Record<string, StepHandlerPort>;

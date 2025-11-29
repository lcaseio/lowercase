import { JobEmitterPort } from "@lcase/ports";
import type { Flow, RunContext } from "@lcase/specs";
import type { AnyEvent } from "@lcase/types";

export interface StepHandler {
  queue(
    flow: Flow,
    context: RunContext,
    stepName: string,
    emitter: JobEmitterPort
  ): Promise<void>;

  onWorkerDone(flow: Flow, context: RunContext, event: AnyEvent): Promise<void>;
}

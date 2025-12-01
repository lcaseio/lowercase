import type { StreamRegistryPort } from "@lcase/ports";
import type { FlowDefinition, StepDefinition } from "@lcase/types";
import { RunContext } from "@lcase/types/engine";
import { randomUUID } from "crypto";

export type ResolvedPipes = {
  from?: {
    id: string;
    buffer?: number;
  };
  to?: {
    id: string;
    payload: string;
  };
};

export class PipeResolver {
  constructor(private readonly streamRegistry: StreamRegistryPort) {}

  resolve(
    flow: FlowDefinition,
    context: RunContext,
    stepName: string
  ): ResolvedPipes {
    const step = flow.steps[stepName] as StepDefinition;
    if (!step) {
      throw new Error(`[pipe-resolver] no step with name ${stepName}`);
    }

    const pipes: ResolvedPipes = {};

    if (step.pipe?.to) {
      const { id } = this.streamRegistry.createStream(randomUUID());
      pipes.to = {
        id,
        payload: step.pipe.to.payload,
      };
      if (context.steps[stepName]?.pipe?.to) {
        context.steps[stepName].pipe.to = pipes.to;
      }
    }
    if (step.pipe?.from) {
      const fromStep = step.pipe.from.step;
      const id = context.steps[fromStep]?.pipe?.to?.id;
      if (id === undefined) {
        throw new Error(`[pipe-resolver] cannot setup stream - no from id;`);
      }
      console.log(`[pipe-resolver] stepName ${stepName}; id${id}`);
      pipes.from = {
        id,
        buffer: step.pipe.from.buffer,
      };
      if (context.steps[stepName]?.pipe?.from) {
        context.steps[stepName].pipe.from = pipes.from;
      }
      console.log(
        `[pipe-resolver] pipes.from ${JSON.stringify(pipes.from, null, 2)}`
      );
    }
    return pipes;
  }
}

import type { StepHandler } from "./step-handler.js";
import type { ResolveStepArgs } from "../resolve.js";
import type { FlowDefinition, StepMcp } from "@lcase/types";
import { PipeResolver } from "../pipe-resolver.js";
import { JobEmitterPort } from "@lcase/ports";
import { RunContext } from "@lcase/types/engine";

export class McpStepHandler implements StepHandler {
  constructor(
    private readonly resolveArgs: ResolveStepArgs,
    private readonly pipeResolver: PipeResolver
  ) {}

  async queue(
    flow: FlowDefinition,
    context: RunContext,
    stepName: string,
    emitter: JobEmitterPort
  ): Promise<void> {
    const step = flow.steps[stepName] as StepMcp;

    try {
      let args = flow.steps[stepName].args;
      if (args !== undefined) {
        args = this.resolveArgs(context, args);
      }
      const pipes = this.pipeResolver.resolve(flow, context, stepName);

      await emitter.emit("job.mcp.submitted", {
        job: {
          id: String(crypto.randomUUID()),
          capid: "mcp",
          toolid: step.tool ?? null,
        },
        args,
        pipe: pipes,
        url: step.url,
        transport: step.transport,
        feature: step.feature,
        ...(step.tool ? { tool: step.tool } : {}),
      });

      context.steps[stepName].status = "submitted";
    } catch (err) {
      console.error(
        `[mcp-step-handler] emitting step ${stepName} in flow ${flow.name}`
      );
      console.error(err);
    }
  }
}

import { resolveSelector, type ResolveStepArgs } from "../resolve.js";
import type { AnyEvent, StepHttpJson } from "@lcase/types";
import type { RunContext, StepContext } from "@lcase/types/engine";
import { PipeResolver } from "../pipe-resolver.js";
import type { CapId, FlowDefinition } from "@lcase/types";
import type {
  EmitterFactoryPort,
  JobEmitterPort,
  StepOutcome,
} from "@lcase/ports";
import { StepHandlerPort } from "@lcase/ports/engine";

export class HttpJsonHandler implements StepHandlerPort {
  constructor(
    private readonly resolveArgs: ResolveStepArgs,
    private readonly pipeResolver: PipeResolver,
    private readonly ef: EmitterFactoryPort
  ) {}

  async handle(
    flow: FlowDefinition,
    context: RunContext,
    stepName: string,
    emitter: JobEmitterPort
  ): Promise<void> {
    const step = flow.steps[stepName] as StepHttpJson;
    if (step.type !== "httpjson") {
      throw new Error("[http-json-handler] step type must be `httpjson`");
    }

    const pipes = this.pipeResolver.resolve(context, stepName);
    try {
      let args = step.args;
      if (args !== undefined) {
        args = this.resolveArgs(context, args);
      }

      const urlResolved = resolveSelector(step.url, context) as string;
      const url = urlResolved ?? step.url;

      console.log("url:", url);
      emitter.emit("job.httpjson.submitted", {
        job: {
          id: String(crypto.randomUUID()),
          toolid: step.tool ?? null,
          capid: step.type as CapId,
        },
        url,
        pipe: pipes,
        ...(step.headers ? { headers: step.headers } : {}),
        ...(step.method ? { method: step.method } : {}),
        ...(step.body ? { body: step.body } : {}),
      });
      context.steps[stepName].status = "started";
    } catch (err) {
      console.error(
        `[mcp-step-handler] emitting step ${stepName} in flow ${flow.name}`
      );
      console.error(err);
    }
  }
}

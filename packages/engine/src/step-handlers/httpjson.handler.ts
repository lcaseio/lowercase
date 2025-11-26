import type { StepHandler } from "./step-handler.js";
import type { ResolveStepArgs } from "../resolve.js";
import type { AnyEvent, StepHttpJson } from "@lcase/types";
import type { RunContext, Flow } from "@lcase/specs";
import type { JobEmitter } from "@lcase/events";
import { PipeResolver } from "../pipe-resolver.js";
import { CapId } from "@lcase/types/flow";

export class HttpJsonHandler implements StepHandler {
  constructor(
    private readonly resolveArgs: ResolveStepArgs,
    private readonly pipeResolver: PipeResolver
  ) {}

  async queue(
    flow: Flow,
    context: RunContext,
    stepName: string,
    emitter: JobEmitter
  ): Promise<void> {
    const step = flow.steps[stepName] as StepHttpJson;
    if (step.type !== "httpjson") {
      throw new Error("[http-json-handler] step type must be `httpjson`");
    }

    const pipes = this.pipeResolver.resolve(flow, context, stepName);
    try {
      let args = flow.steps[stepName].args;
      if (args !== undefined) {
        args = this.resolveArgs(context, args);
      }

      emitter.emit("job.httpjson.submitted", {
        job: {
          id: String(crypto.randomUUID()),
          toolid: "httpjson",
          capid: step.type as CapId,
        },
        url: step.url,
        pipe: {
          to: undefined,
          from: undefined,
        },
      });
      context.steps[stepName].status = "submitted";
    } catch (err) {
      console.error(
        `[mcp-step-handler] emitting step ${stepName} in flow ${flow.name}`
      );
      console.error(err);
    }
  }

  onWorkerDone(
    flow: Flow,
    context: RunContext,
    event: AnyEvent
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

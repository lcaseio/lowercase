import { FlowRouterPort } from "@lcase/ports/engine";
import { RunContext } from "@lcase/types/engine";

export class FlowRouter implements FlowRouterPort {
  startFlow(ctx: RunContext): void {
    const stepId = ctx.definition.start;

    const action = {
      type: "updateContext",
      baseKey: "steps",
      updates: {},
    };
  }
  getNextAction(context: RunContext): void {
    throw new Error("Method not implemented.");
  }
}

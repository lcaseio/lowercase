import { RmToolHandlerPort } from "@lcase/ports/rm";
import { AnyEvent } from "@lcase/types";
import { HandlerDeps } from "../handlers.js";

export class McpSubmittedHandler implements RmToolHandlerPort {
  constructor(private readonly deps: HandlerDeps) {}

  handle(event: AnyEvent<"job.mcp.submitted">) {
    // wire logic together for what to do with this event
    // parse?
    // get policy -> resolve tool
    const tool = this.deps.policy.resolve(event);
    // check tool concurrency, route to .delayed() vs
  }
}

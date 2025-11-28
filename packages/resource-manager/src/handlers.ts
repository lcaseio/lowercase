import type { RmHandlerRegistryPort, RmToolHandlerPort } from "@lcase/ports/rm";
import { McpSubmittedHandler } from "./handlers/mcp.submitted.js";
import type { JobEventType } from "@lcase/types";
import type {
  EmitterFactoryPort,
  QueuePort,
  SystemEmitterPort,
} from "@lcase/ports";
import { CapPolicies } from "./cap-policy.js";
export type HandlerDeps = {
  tc: RmToolHandlerPort;
  queue: QueuePort;
  ef: EmitterFactoryPort;
  policy: CapPolicies;
};

export class HandlerRegistry implements RmHandlerRegistryPort {
  private readonly handlers = new Map<JobEventType, RmToolHandlerPort>();
  constructor(private readonly deps: HandlerDeps) {
    this.handlers.set("job.mcp.submitted", new McpSubmittedHandler(deps));
    this.handlers.set("job.httpjson.submitted", new McpSubmittedHandler(deps));
  }
  getHandler(type: JobEventType): RmToolHandlerPort | undefined {
    return this.handlers.get(type);
  }
}

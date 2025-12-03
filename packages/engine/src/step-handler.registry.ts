import type { ResolveStepArgs } from "./resolve.js";
import { PipeResolver } from "./pipe-resolver.js";
import { McpStepHandler } from "./step-handlers/mcp.handler.js";
import { HttpJsonHandler } from "./step-handlers/httpjson.handler.js";
import { StepHandlerRegistryPort } from "@lcase/ports/engine";
import { EmitterFactoryPort } from "@lcase/ports";
export type StepHandlerRegistry = {
  mcp: () => McpStepHandler;
  httpjson: () => HttpJsonHandler;
};

export function wireStepHandlers(
  argResolver: ResolveStepArgs,
  pipeResolver: PipeResolver,
  ef: EmitterFactoryPort
): StepHandlerRegistryPort {
  const stepHandlers = {
    mcp: new McpStepHandler(argResolver, pipeResolver),
    httpjson: new HttpJsonHandler(argResolver, pipeResolver, ef),
  };
  return stepHandlers;
}

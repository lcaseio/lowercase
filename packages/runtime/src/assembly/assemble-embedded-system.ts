import type { ManagedResource } from "./managed-resource.js";
import {
  createManagedRuntime,
  type ManagedRuntime,
} from "./managed-runtime.js";

// Generalizes WorkflowRuntime's hardcoded router->sinks->tap->engine->limiter
// sequence (packages/runtime/src/workflow.runtime.ts), with bus folded in
// as the base dependency -- started first, stopped last -- resolving that
// code's current drift (limiter.stop() is never called; bus has no
// start() counterpart at all) via one symmetric start/reverse-stop policy.
//
// Every field is required -- completeness is enforced by TypeScript here,
// not by a raw config type: a caller missing e.g. `limiter` fails to
// typecheck, it does not silently assemble an incomplete system.
export type EmbeddedSystemAssemblyInput = {
  bus: ManagedResource<unknown>;
  router: ManagedResource<unknown>;
  sinks: readonly ManagedResource<unknown>[];
  tap: ManagedResource<unknown>;
  engine: ManagedResource<unknown>;
  limiter: ManagedResource<unknown>;
};

export function assembleEmbeddedSystem(
  input: EmbeddedSystemAssemblyInput,
): ManagedRuntime {
  const resources: ManagedResource<unknown>[] = [
    input.bus,
    input.router,
    ...input.sinks,
    input.tap,
    input.engine,
    input.limiter,
  ];
  return createManagedRuntime(resources);
}

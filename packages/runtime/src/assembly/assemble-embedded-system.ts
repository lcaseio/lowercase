import type { ManagedResource } from "./managed-resource.js";
import {
  createManagedRuntime,
  type ManagedRuntime,
} from "./managed-runtime.js";
import type {
  EventBusPort,
  EventSink,
  EnginePort,
  LimiterPort,
  ObservabilityTapPort,
} from "@lcase/ports";

// Generalizes WorkflowRuntime's hardcoded router->sinks->tap->engine->limiter
// sequence (packages/runtime/src/workflow.runtime.ts, now deleted), with bus
// folded in as the base dependency -- started first, stopped last --
// resolving that code's old drift (limiter.stop() was never called; bus had
// no start() counterpart at all) via one symmetric start/reverse-stop policy.
// `router` dropped from that sequence once `NodeRouter`/`QueuePort` were
// confirmed fully dead (swappable-infrastructure the related change) -- bus->sinks->tap->
// engine->limiter is the sequence now.
//
// Every field is required -- completeness is enforced by TypeScript here,
// not by a raw config type: a caller missing e.g. `limiter` fails to
// typecheck, it does not silently assemble an incomplete system. Fields are
// typed against each resource's real port (not `ManagedResource<unknown>`)
// now that the related change has a real caller to confirm this doesn't force awkward
// casting.
export type EmbeddedSystemAssemblyInput = {
  bus: ManagedResource<EventBusPort>;
  sinks: readonly ManagedResource<EventSink>[];
  tap: ManagedResource<ObservabilityTapPort>;
  engine: ManagedResource<EnginePort>;
  limiter: ManagedResource<LimiterPort>;
};

export function assembleEmbeddedSystem(
  input: EmbeddedSystemAssemblyInput,
): ManagedRuntime {
  const resources: ManagedResource<unknown>[] = [
    input.bus,
    ...input.sinks,
    input.tap,
    input.engine,
    input.limiter,
  ];
  return createManagedRuntime(resources);
}

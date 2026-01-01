import type { Registry } from "../types/registry.js";
import { busRegistry } from "../registries/bus.registry.js";
import { queueRegistry } from "../registries/queue.registry.js";
import { limiterRegistry } from "../registries/limiter.registry.js";

export function makeRegistryFactory<R extends Registry>(registry: R) {
  return function createFactory<
    Placement extends keyof R,
    Transport extends keyof R[Placement],
    Store extends keyof R[Placement][Transport]
  >(
    placement: Placement,
    transport: Transport,
    store: Store
  ): R[Placement][Transport][Store] {
    const placementRegistry = registry[placement];
    if (!placementRegistry) {
      throw new Error(
        `[runtime] no registry for placement ${String(placement)}`
      );
    }

    const transportRegistry = placementRegistry[transport];
    if (!transportRegistry) {
      throw new Error(
        `[runtime] no registry for transport ${String(transport)}`
      );
    }

    const factory = transportRegistry[store];
    if (!factory || typeof factory !== "function") {
      throw new Error(`[runtime] no registry for store ${String(store)}`);
    }

    return factory;
  };
}

export const makeQueueFactory = makeRegistryFactory(queueRegistry);
export const makeBusFactory = makeRegistryFactory(busRegistry);
export const makeLimiterFactory = makeRegistryFactory(limiterRegistry);

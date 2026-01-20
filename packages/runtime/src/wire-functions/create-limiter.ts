import type { LimiterDeps } from "@lcase/limiter";
import { makeLimiterFactory } from "../factories/registry.factory.js";
import type { LimiterConfig } from "../types/runtime.config.js";
import { LimiterPort } from "@lcase/ports";
export function createLimiter(
  config: LimiterConfig,
  deps: LimiterDeps
): LimiterPort {
  const makeLimiter = makeLimiterFactory(
    config.placement,
    config.transport,
    config.store
  );

  const limiter = makeLimiter(config.id, config.scope, deps);
  return limiter;
}

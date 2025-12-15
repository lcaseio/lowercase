import { CapId } from "../flow/map.js";

/**
 * NOTE: Tool types are in development.
 * Some are more detailed than what is currently implemented
 * based upon research and future design philosophy.
 *
 * Issues around the resource manager, concurrency tools,
 * instantiating internal tool objects, rate limiting, etc,
 * are being shaped.  Thus, type will change over time to gradually
 * adopt more complex features and orchestration.
 */
export type ToolId = string;

export type ToolContext = {};

export type RateLimitPolicy = {
  scope: "worker" | "global";
  maxRequests: number;
  perMs: number;
  keyStrategy?: "tool" | "url"; // named strategy
};

export type ToolRuntimePolicy = {
  preferredScope: "stateless" | "worker-singleton" | "job-scoped";
  makeCacheKey?: (args: unknown) => string;
};

// binds a spec to a factory function and runtime policy used by ToolRuntimeManager in a worker

export type ToolSpec<ID extends ToolId = ToolId> = {
  id: ID;
  maxConcurrency: number;
  capabilities: CapId[];
  location: "internal" | "external";
  rateLimit?: RateLimitPolicy;
};

export type InternalToolsMap = Record<string, ToolSpec<CapId>>;

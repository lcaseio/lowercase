import type { CapId } from "../flow/map.js";

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

// export type ToolContext = {}; -- placeholder, not yet given real fields or
// wired to anything; kept as a comment rather than deleted since
// ToolContextSchema (packages/events/src/schemas/tool.event.schema.ts) is a
// similarly-named, currently-unrelated thing a future reader may go looking
// for a matching type for.

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

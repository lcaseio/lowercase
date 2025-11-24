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
export type ToolId = "mcp" | "httpjson";

export type ToolContext = {};

/** old tool context
 * export type ToolContext<T extends JobRequestedType> = {
  data: JobEventData<T>;
  flowId: string;
  runId: string;
  stepId: string;
  capability: string;
  workerId: string;
  consumer?: ConsumerStreamPort;
  producer?: ProducerStreamPort;
  emitter?: never; // not yet implemented tool event emitter

  auth?: Record<string, string>;
  config?: Record<string, string>;
};
 */

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
export type ToolBinding<ID extends ToolId = ToolId> = {
  spec: ToolSpec<ID>;
  // create: () => ToolMap[ID],
  runtimePolicy: ToolRuntimePolicy;
};

export type ToolSpec<ID extends ToolId = ToolId> = {
  id: ID;
  maxConcurrency: number;
  capabilities: string[];
  location: "internal" | "external";
  rateLimit?: RateLimitPolicy;
};

/**
 * args should not be unknown in the future.
 * they can map directly to event payloads for a job
 *
 * for example:
 *
 * event: job.llm.generate.submitted
 * event.data is the payload for args
 *
 * every job event with a middle portion is a tool entity.
 *
 *
 *
 * job.llm.generate.submitted
 *
 * job.llm.generate.assigned
 *
 * domain: job
 * entity: llm.generate
 * action: submitted
 *
 */
export interface ToolInstance<ID extends ToolId = ToolId> {
  id: ID;
  invoke(args: unknown, ctx: ToolContext): Promise<unknown>;
}

export type ToolSpecsById = {
  [ID in ToolId]: ToolSpec<ID>;
};

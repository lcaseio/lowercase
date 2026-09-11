import { createClient, type RedisClientType } from "redis";
import { RedisMessageLog } from "@lcase/adapters/message-log";
import type { MessagingConfig } from "./config/messaging.config.js";
import {
  createInProcessMessageRouter,
  createRedisMessageRouter,
  type MessageRouter,
  type MessageRouterTopology,
} from "@lcase/message-router";
import type { LifecycleHooks } from "@lcase/assembly";

export type BuiltMessageRouter = {
  router: MessageRouter;
  // Supplied separately rather than as router methods: an in-process router
  // genuinely has nothing to start, and managedResource() exists to normalize
  // exactly that difference without either carrier faking the other's shape.
  hooks: LifecycleHooks<MessageRouter>;
};

// The one real per-carrier choice this profile makes -- isolated into its own
// function so the branch is directly unit-testable without pulling in the rest
// of the profile's wiring, matching buildArtifactStore.
export function buildMessageRouter(
  config: MessagingConfig,
  topology: MessageRouterTopology,
): BuiltMessageRouter {
  switch (config.kind) {
    case "in-process":
      return { router: createInProcessMessageRouter(topology), hooks: {} };
    case "redis-streams": {
      const router = createRedisMessageRouter({
        ...topology,
        // One connected client per call: each blocking read loop needs a
        // connection of its own, and so does publishing.
        createLog: async () => {
          const client: RedisClientType = createClient({ url: config.url });
          await client.connect();
          return new RedisMessageLog(client);
        },
        ...(config.keyPrefix !== undefined
          ? { keyPrefix: config.keyPrefix }
          : {}),
        ...(config.consumerName !== undefined
          ? { consumerName: config.consumerName }
          : {}),
        ...(config.blockMs !== undefined ? { blockMs: config.blockMs } : {}),
      });
      return {
        router,
        hooks: {
          start: () => router.start(),
          stop: () => router.stop(),
        },
      };
    }
  }
}

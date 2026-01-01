import type { Registry } from "../types/registry.js";

import { Limiter, type LimiterDeps } from "@lcase/limiter";

export const limiterRegistry = {
  embedded: {
    "event-emitter": {
      none: (id: string, scope: string, deps: LimiterDeps) =>
        new Limiter(id, scope, deps),
    },
  },
} as const satisfies Registry;

export type LimiterRegistry = typeof limiterRegistry;
export type LimiterPlacement = keyof LimiterRegistry;
export type LimiterTransport = keyof LimiterRegistry[LimiterPlacement];
export type LimiterStore =
  keyof LimiterRegistry[LimiterPlacement][LimiterTransport];

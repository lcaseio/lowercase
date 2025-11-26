import type { InternalToolsMap } from "@lcase/types";

export const internalToolConfig = {
  mcp: {
    id: "mcp",
    maxConcurrency: 2,
    capabilities: [],
    location: "internal",
    rateLimit: undefined,
  },
  httpjson: {
    id: "httpjson",
    maxConcurrency: 1,
    capabilities: [],
    location: "internal",
    rateLimit: undefined,
  },
} satisfies InternalToolsMap;

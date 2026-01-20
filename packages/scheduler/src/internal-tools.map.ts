import type { InternalToolsMap } from "@lcase/types";
/**
 * default internal tool settings. hardcoded for now in terms of concurrencies,
 * and no rate limits are used globally at the resource manager level yet.
 */
export const internalToolConfig = {
  mcp: {
    id: "mcp",
    maxConcurrency: 1,
    capabilities: ["mcp"],
    location: "internal",
    rateLimit: undefined,
  },
  httpjson: {
    id: "httpjson",
    maxConcurrency: 1,
    capabilities: ["httpjson"],
    location: "internal",
    rateLimit: undefined,
  },
} satisfies InternalToolsMap;

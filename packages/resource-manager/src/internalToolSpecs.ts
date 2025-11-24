import type { ToolSpecsById } from "@lcase/types";

export const internalToolConfig = {
  mcp: {
    id: "mcp",
    maxConcurrency: 0,
    capabilities: [],
    location: "internal",
    rateLimit: undefined,
  },
  httpjson: {
    id: "httpjson",
    maxConcurrency: 0,
    capabilities: [],
    location: "internal",
    rateLimit: undefined,
  },
} satisfies ToolSpecsById;

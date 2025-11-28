import type { InternalToolsMap, ToolSpec } from "@lcase/types";
import { CapId } from "../../types/dist/flow/map.js";

export const internalToolConfig = {
  mcp: {
    id: "mcp",
    maxConcurrency: 2,
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

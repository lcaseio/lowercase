import { ToolBinding } from "@lcase/ports/tools";
import { McpTool } from "./mcp.tool.js";

export const mcpBinding = {
  spec: {
    id: "mcp",
    maxConcurrency: 1,
    capabilities: [],
    location: "internal",
    rateLimit: undefined,
  },
  create: () => new McpTool(),
  runtimePolicy: {
    preferredScope: "stateless",
    makeCacheKey: undefined,
  },
} satisfies ToolBinding;

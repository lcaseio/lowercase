import { ToolBinding, ToolDeps } from "@lcase/ports/tools";
import { McpTool } from "./mcp.tool.js";
import { ToolId } from "@lcase/types";

export const mcpBinding = {
  spec: {
    id: "mcp",
    maxConcurrency: 1,
    capabilities: [],
    location: "internal",
    rateLimit: undefined,
  },
  create: (deps: ToolDeps) => new McpTool(deps),
  runtimePolicy: {
    preferredScope: "stateless",
    makeCacheKey: undefined,
  },
} satisfies ToolBinding;

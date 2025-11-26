import type { ToolBinding, ToolDeps } from "@lcase/ports/tools";
import { HttpJsonTool } from "./httpjson.tool.js";

export const httpJsonBinding = {
  spec: {
    id: "httpjson",
    maxConcurrency: 1,
    capabilities: [],
    location: "internal",
    rateLimit: undefined,
  },
  create: (deps: ToolDeps) => new HttpJsonTool(deps),
  runtimePolicy: {
    preferredScope: "stateless",
    makeCacheKey: undefined,
  },
} satisfies ToolBinding<"httpjson">;

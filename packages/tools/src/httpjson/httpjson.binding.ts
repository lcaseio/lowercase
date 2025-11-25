import type { ToolBinding } from "@lcase/ports/tools";
import { HttpJsonTool } from "./httpjson.tool.js";

export const httpJsonBinding = {
  spec: {
    id: "httpjson",
    maxConcurrency: 0,
    capabilities: [],
    location: "internal",
    rateLimit: undefined,
  },
  create: () => new HttpJsonTool(),
  runtimePolicy: {
    preferredScope: "stateless",
    makeCacheKey: undefined,
  },
} satisfies ToolBinding<"httpjson">;

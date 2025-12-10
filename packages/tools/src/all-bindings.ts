import { ToolBinding, ToolBindingMap } from "@lcase/ports/tools";
import { httpJsonBinding } from "./httpjson/httpjson.binding.js";
import { mcpBinding } from "./mcp/mcp.binding.js";
import { ToolId } from "@lcase/types";

export const allToolBindings = {
  mcp: mcpBinding,
  httpjson: httpJsonBinding,
} satisfies ToolBindingMap;

export const allToolBindingsMap = new Map<ToolId, ToolBinding>();

for (const [id, binding] of Object.entries(allToolBindings)) {
  allToolBindingsMap.set(id as ToolId, binding as ToolBinding);
}

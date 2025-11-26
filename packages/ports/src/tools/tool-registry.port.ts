import type { ToolId } from "@lcase/types";
import type { ToolInstancePort, ToolBinding } from "./tool-instance.port.js";
import { ToolDeps } from "./tool-context.js";

export interface ToolRegistryPort {
  getBinding(id: ToolId): ToolBinding<ToolId> | undefined;
  createInstance(id: ToolId, deps: ToolDeps): ToolInstancePort<ToolId>;
  addTool(binding: ToolBinding<ToolId>): void;
  removeTool(id: ToolId): void;
  listToolIds(): ToolId[];
}

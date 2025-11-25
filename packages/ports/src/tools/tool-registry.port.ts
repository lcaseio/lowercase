import type { ToolId } from "@lcase/types";
import type { ToolInstancePort, ToolBinding } from "./tool-instance.port.js";

export interface ToolRegistryPort {
  getBinding(id: ToolId): ToolBinding<ToolId> | undefined;
  createInstance(id: ToolId): ToolInstancePort<ToolId>;
  addTool(binding: ToolBinding<ToolId>): void;
  removeTool(id: ToolId): void;
  listToolIds(): ToolId[];
}

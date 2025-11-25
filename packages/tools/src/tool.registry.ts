import type { ToolId } from "@lcase/types";
import type {
  ToolInstancePort,
  ToolRegistryPort,
  ToolBinding,
  ToolBindingMap,
} from "@lcase/ports/tools";

export type ObjectKey = {};

export class ToolRegistry<ID extends ToolId> implements ToolRegistryPort {
  #bindings: Map<ID, ToolBinding<ID>>;
  constructor(toolBindings?: Map<ID, ToolBinding<ID>>) {
    if (toolBindings) {
      this.#bindings = new Map<ID, ToolBinding<ID>>([...toolBindings]);
    } else {
      this.#bindings = new Map<ID, ToolBinding<ID>>();
    }
  }
  getBinding(id: ID): ToolBinding<ID> | undefined {
    return this.#bindings.get(id);
  }
  createInstance(id: ID): ToolInstancePort<ID> {
    const binding = this.#bindings.get(id);
    if (!binding) {
      throw new Error(`No binding registered for tool:${id}`);
    }
    return binding.create();
  }
  addTool(binding: ToolBinding<ID>): void {
    this.#bindings.set(binding.spec.id, binding);
  }
  removeTool(id: ID): void {
    this.#bindings.delete(id);
  }
  listToolIds(): ID[] {
    return [...this.#bindings.keys()];
  }
}

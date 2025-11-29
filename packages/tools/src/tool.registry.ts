import type { ToolId } from "@lcase/types";
import type {
  ToolInstancePort,
  ToolRegistryPort,
  ToolBinding,
  ToolDeps,
} from "@lcase/ports/tools";

export type ObjectKey = {};

export class ToolRegistry<Id extends ToolId> implements ToolRegistryPort {
  #bindings: Map<Id, ToolBinding<Id>>;
  constructor(toolBindings?: Map<Id, ToolBinding<Id>>) {
    if (toolBindings) {
      this.#bindings = new Map<Id, ToolBinding<Id>>([...toolBindings]);
    } else {
      this.#bindings = new Map<Id, ToolBinding<Id>>();
    }
  }
  getBinding(id: Id): ToolBinding<Id> | undefined {
    return this.#bindings.get(id);
  }
  createInstance(id: Id, deps: ToolDeps): ToolInstancePort<Id> {
    const binding = this.#bindings.get(id);
    if (!binding) {
      throw new Error(`No binding registered for tool:${id}`);
    }
    return binding.create(deps);
  }
  addTool(binding: ToolBinding<Id>): void {
    this.#bindings.set(binding.spec.id, binding);
  }
  removeTool(id: Id): void {
    this.#bindings.delete(id);
  }
  listToolIds(): Id[] {
    return [...this.#bindings.keys()];
  }
}

import type { ToolId, ToolSpec, ToolRuntimePolicy } from "@lcase/types";
import { ToolDeps } from "./tool-context.js";

export interface ToolInstancePort<ID extends ToolId = ToolId> {
  id: ID;
  invoke(event: unknown): Promise<unknown>;
}

export type ToolBinding<ID extends ToolId = ToolId> = {
  spec: ToolSpec<ID>;
  create: (deps: ToolDeps) => ToolInstancePort<ID>;
  runtimePolicy: ToolRuntimePolicy;
};

export type ToolBindingMap = {
  [ID in ToolId]: ToolBinding<ID>;
};

export type PartialToolBindingMap = Partial<ToolBindingMap>;

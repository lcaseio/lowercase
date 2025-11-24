import type {
  ToolId,
  ToolContext,
  ToolSpec,
  ToolRuntimePolicy,
} from "@lcase/types";

export interface ToolInstancePort<ID extends ToolId = ToolId> {
  id: ID;
  invoke(args: unknown, ctx: ToolContext): Promise<unknown>;
}

export type ToolBinding<ID extends ToolId = ToolId> = {
  spec: ToolSpec<ID>;
  create: () => ToolInstancePort<ID>;
  runtimePolicy: ToolRuntimePolicy;
};

export type ToolBindindObject = {
  [ID in ToolId]: ToolBinding<ID>;
};

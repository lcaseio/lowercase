import { RunContext } from "@lcase/types/engine";

export type RouterActions = {};

export type RouterStateUpdate = {
  type: "state";
  changes: Record<string, unknown>;
};

export interface FlowRouterPort {
  startFlow(context: RunContext): void;
  getActions(context: RunContext): void;
}

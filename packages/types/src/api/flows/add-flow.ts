import type { FlowDefinition } from "../../flow/flow-definition.js";

export type PostFlowJsonReq = {
  flowDef: FlowDefinition;
};

export type PostFlowJsonRes =
  | {
      ok: true;
    }
  | { ok: false; error: string };

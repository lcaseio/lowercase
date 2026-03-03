import type { FlowIndex } from "../../flow-index-store/flow-index.js";
import type { FlowDefinition } from "../../flow/flow-definition.js";
import type { Result } from "../../result.type.js";

export type PostJsonFlowReq = {
  body: FlowDefinition;
};

export type PostJsonFlowRes = Result<FlowIndex, string>;

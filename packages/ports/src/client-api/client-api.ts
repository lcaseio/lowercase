import { FlowDefinition, PostJsonFlowReq, PostJsonFlowRes } from "@lcase/types";

export interface ClientApiPort {
  postJsonFlow(json: FlowDefinition): Promise<PostJsonFlowRes>;
}

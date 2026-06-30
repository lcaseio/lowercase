import { FlowDefinition, PostFlowReq, PostFlowRes } from "@lcase/types";

export interface ClientApiPort {
  postJsonFlow(json: FlowDefinition): Promise<PostFlowRes>;
}

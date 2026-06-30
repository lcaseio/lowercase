import type { FlowDefinition } from "../../flow/flow-definition.js";
import type { CreateFlowRecordResult } from "../../db-sql/flow-record.js";
import type { Result } from "../../result.type.js";

export type PostFlowReq = {
  body: FlowDefinition;
};

export type PostFlowRes = Result<CreateFlowRecordResult, string>;

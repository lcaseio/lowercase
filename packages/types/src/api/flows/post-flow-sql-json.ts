import type { FlowDefinition } from "../../flow/flow-definition.js";
import type { CreateFlowRecordResult } from "../../flow/flow-record.js";
import type { Result } from "../../result.type.js";

export type PostSqlFlowReq = {
  body: FlowDefinition;
};

export type PostSqlFlowRes = Result<CreateFlowRecordResult, string>;

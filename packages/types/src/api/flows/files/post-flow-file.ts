import type { CreateFlowRecordResult } from "../../../db-sql/flow-record.js";
import type { Result } from "../../../result.type.js";

export type PostFlowFileRes = Result<CreateFlowRecordResult, string>;

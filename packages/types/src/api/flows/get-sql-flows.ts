import type { FlowDefinition } from "../../flow/flow-definition.js";
import type {
  FlowRecord,
  FlowVersionRecord,
} from "../../flow/flow-record.js";
import type { Result } from "../../result.type.js";

export type FlowLatestVersionSummary = {
  id: string;
  flowId: string;
  sequence: number;
  definitionHash: string;
  versionLabel?: string;
  description?: string;
  createdAt: string;
};

export type SqlFlowListItem = {
  flow: FlowRecord;
  latestVersion: FlowLatestVersionSummary;
};

export type GetSqlFlowsRes = Result<SqlFlowListItem[], string>;

export type GetSqlFlowVersionsRes = Result<FlowVersionRecord[], string>;

export type SqlFlowVersionDefinition = {
  version: FlowVersionRecord;
  definition: FlowDefinition;
};

export type GetSqlFlowVersionRes = Result<SqlFlowVersionDefinition, string>;

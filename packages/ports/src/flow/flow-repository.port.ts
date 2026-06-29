import type {
  CreateFlowRecordInput,
  CreateFlowRecordResult,
  FlowRecord,
  SqlFlowListItem,
  FlowVersionRecord,
  Result,
} from "@lcase/types";

export interface FlowRepositoryPort {
  createFlow(
    input: CreateFlowRecordInput,
  ): Promise<Result<CreateFlowRecordResult, string>>;
  getFlow(flowId: string): Promise<Result<FlowRecord, string>>;
  listFlows(): Promise<FlowRecord[]>;
  listFlowsWithLatestVersion(): Promise<SqlFlowListItem[]>;
  listFlowVersions(flowId: string): Promise<FlowVersionRecord[]>;
  getFlowVersion(flowVersionId: string): Promise<Result<FlowVersionRecord, string>>;
  getFlowVersionDefinitionHash(flowVersionId: string): Promise<Result<string, string>>;
}

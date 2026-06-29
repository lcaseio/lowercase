import type {
  CreateFlowRecordInput,
  CreateFlowRecordResult,
  FlowRecord,
  FlowVersionRecord,
  Result,
} from "@lcase/types";

export interface FlowRepositoryPort {
  createFlow(
    input: CreateFlowRecordInput,
  ): Promise<Result<CreateFlowRecordResult, string>>;
  getFlow(flowId: string): Promise<Result<FlowRecord, string>>;
  listFlows(): Promise<FlowRecord[]>;
  listFlowVersions(flowId: string): Promise<FlowVersionRecord[]>;
  getFlowVersionDefinitionHash(flowVersionId: string): Promise<Result<string, string>>;
}

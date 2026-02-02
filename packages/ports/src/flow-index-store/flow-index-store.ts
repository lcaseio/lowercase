import type { FlowIndex, Result } from "@lcase/types";

export interface FlowIndexStorePort {
  putFlowIndex(index: FlowIndex): Promise<Result<string, string>>;
  getFlowIndex(hash: string): Promise<Result<FlowIndex, string>>;
}

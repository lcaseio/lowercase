import type {
  ReusableRunStepData,
  Result,
  RunDetail,
  RunListItem,
} from "@lcase/types";

export interface RunQueryPort {
  listRuns(): Promise<RunListItem[]>;
  listByFlowVersionId(flowVersionId: string): Promise<RunListItem[]>;
  getRunDetail(runId: string): Promise<Result<RunDetail, string>>;
  getReusableStepData(
    parentRunId: string,
    stepIds: string[],
  ): Promise<Result<Record<string, ReusableRunStepData>, string>>;
}

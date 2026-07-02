import type { Result, ReusableRunStepData, RunDetail } from "@lcase/types";

export interface RunQueryPort {
  getRunDetail(runId: string): Promise<Result<RunDetail, string>>;
  getReusableStepData(
    runId: string,
    stepId: string,
  ): Promise<Result<ReusableRunStepData, string>>;
}

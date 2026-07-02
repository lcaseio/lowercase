import type {
  Result,
  RunStepProjectionRecord,
  UpsertRunStepProjectionInput,
} from "@lcase/types";

export interface RunStepProjectionRepositoryPort {
  upsertStepProjection(
    input: UpsertRunStepProjectionInput,
  ): Promise<Result<RunStepProjectionRecord, string>>;
  getStepProjection(
    runId: string,
    stepId: string,
  ): Promise<Result<RunStepProjectionRecord, string>>;
  listStepProjections(runId: string): Promise<RunStepProjectionRecord[]>;
}

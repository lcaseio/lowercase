import type {
  CreateRunRecordInput,
  Result,
  RunRecord,
  UpdateRunRecordInput,
} from "@lcase/types";

export interface RunRepositoryPort {
  createRun(input: CreateRunRecordInput): Promise<Result<RunRecord, string>>;
  updateRun(input: UpdateRunRecordInput): Promise<Result<RunRecord, string>>;
  getRun(runId: string): Promise<Result<RunRecord, string>>;
  listRuns(): Promise<RunRecord[]>;
}

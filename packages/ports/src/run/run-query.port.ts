import type { Result, RunDetail, RunListItem } from "@lcase/types";

export interface RunQueryPort {
  listRuns(): Promise<RunListItem[]>;
  getRunDetail(runId: string): Promise<Result<RunDetail, string>>;
}

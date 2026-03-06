import type { RunParams, Result } from "@lcase/types";

export interface RunParamsIndexStorePort {
  init(): Promise<void>;
  putRunParams(runId: string, params: RunParams): Promise<Result<string, string>>;
  getRunParams(runId: string): Promise<RunParams | undefined>;
  getAllRunIds(): Promise<string[]>;
}

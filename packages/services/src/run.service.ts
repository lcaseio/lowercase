import {
  EmitterFactoryPort,
  RunRequest,
  RunQueryPort,
  RunServicePort,
} from "@lcase/ports";
import { createRunId, runFlow } from "@lcase/run-flow";
import { Result, RunDetail, RunListItem } from "@lcase/types";

type RunServiceDeps = {
  ef: EmitterFactoryPort;
  runQuery: RunQueryPort;
  // runParamsStore: RunParamsIndexStorePort;
};

export class RunService implements RunServicePort {
  private readonly ef: EmitterFactoryPort;
  private readonly runQuery: RunQueryPort;
  // private readonly runParamsStore: RunParamsIndexStorePort;

  constructor(deps: RunServiceDeps) {
    this.ef = deps.ef;
    this.runQuery = deps.runQuery;
    // this.runParamsStore = deps.runParamsStore;
  }

  async requestRun(request: RunRequest) {
    await runFlow({ ...request, ef: this.ef });
  }

  makeRunId() {
    return createRunId();
  }

  async listAllRuns(): Promise<RunListItem[]> {
    return this.runQuery.listRuns();
  }

  async getRunDetail(runId: string): Promise<Result<RunDetail, string>> {
    return this.runQuery.getRunDetail(runId);
  }

  // async getRunParamsIndex(runId: string): Promise<Result<RunParams, string>> {
  //   const runParams = await this.runParamsStore.getRunParams(runId);
  //   if (!runParams) return { ok: false, error: "Error getting run params" };
  //   return { ok: true, value: runParams };
  // }
}

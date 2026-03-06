import {
  EmitterFactoryPort,
  FlowIndexStorePort,
  RunIndexStorePort,
  RunParamsIndexStorePort,
  RunRequest,
  RunServicePort,
} from "@lcase/ports";
import { createRunId, runFlow } from "@lcase/run-flow";
import { listAllRuns } from "@lcase/run-history";
import { Result, RunIndex, RunParams } from "@lcase/types";

type RunServiceDeps = {
  ef: EmitterFactoryPort;
  runStore: RunIndexStorePort;
  flowStore: FlowIndexStorePort;
  runParamsStore: RunParamsIndexStorePort;
};

export class RunService implements RunServicePort {
  private readonly ef: EmitterFactoryPort;
  private readonly runStore: RunIndexStorePort;
  private readonly flowStore: FlowIndexStorePort;
  private readonly runParamsStore: RunParamsIndexStorePort;

  constructor(deps: RunServiceDeps) {
    this.ef = deps.ef;
    this.runStore = deps.runStore;
    this.flowStore = deps.flowStore;
    this.runParamsStore = deps.runParamsStore;
  }

  async requestRun(request: RunRequest) {
    await runFlow({ ...request, ef: this.ef });
  }

  makeRunId() {
    return createRunId();
  }

  async listAllRuns() {
    const runList = await listAllRuns(this.runStore, this.flowStore);
    return runList;
  }

  async getRunIndex(runId: string): Promise<Result<RunIndex, string>> {
    const runIndex = await this.runStore.getRunIndex(runId);
    if (!runIndex) return { ok: false, error: "No run index found" };
    return { ok: true, value: runIndex };
  }

  async getRunParamsIndex(runId: string): Promise<Result<RunParams, string>> {
    const runParams = await this.runParamsStore.getRunParams(runId);
    if (!runParams) return { ok: false, error: "Error getting run params" };
    return { ok: true, value: runParams };
  }
}

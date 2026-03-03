import {
  EmitterFactoryPort,
  FlowIndexStorePort,
  RunIndexStorePort,
  RunRequest,
  RunServicePort,
} from "@lcase/ports";
import { createRunId, runFlow } from "@lcase/run-flow";
import { listAllRuns } from "@lcase/run-history";
import { Result, RunIndex } from "@lcase/types";

export class RunService implements RunServicePort {
  constructor(
    private readonly ef: EmitterFactoryPort,
    private readonly runStore: RunIndexStorePort,
    private readonly flowStore: FlowIndexStorePort,
  ) {}

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
}

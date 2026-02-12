import {
  EmitterFactoryPort,
  EventBusPort,
  FlowIndexStorePort,
  RunIndexStorePort,
  RunServicePort,
} from "@lcase/ports";
import { createRunId, runFlow } from "@lcase/run-flow";
import { listAllRuns } from "@lcase/run-history";

export class RunService implements RunServicePort {
  constructor(
    private readonly ef: EmitterFactoryPort,
    private readonly runStore: RunIndexStorePort,
    private readonly flowStore: FlowIndexStorePort,
  ) {}

  async requestRun(flowDefHash: string, source: string, runId?: string) {
    await runFlow(flowDefHash, this.ef, source, runId);
  }

  makeRunId() {
    return createRunId();
  }

  async listAllRuns() {
    const runList = await listAllRuns(this.runStore, this.flowStore);
    return runList;
  }
}

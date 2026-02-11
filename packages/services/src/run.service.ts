import { EmitterFactoryPort, EventBusPort, RunServicePort } from "@lcase/ports";
import { createRunId, runFlow } from "@lcase/run-flow";

export class RunService implements RunServicePort {
  constructor(private readonly ef: EmitterFactoryPort) {}

  async requestRun(flowDefHash: string, source: string, runId?: string) {
    await runFlow(flowDefHash, this.ef, source, runId);
  }

  makeRunId() {
    return createRunId();
  }
}

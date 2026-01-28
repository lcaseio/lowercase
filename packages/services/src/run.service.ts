import { EmitterFactoryPort, RunServicePort } from "@lcase/ports";

import { runFlow } from "@lcase/run-flow";

export class RunService implements RunServicePort {
  constructor(private readonly ef: EmitterFactoryPort) {}

  async requestRun(flowDefHash: string, source: string) {
    await runFlow(flowDefHash, this.ef, source);
  }
}

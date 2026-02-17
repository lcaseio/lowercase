import {
  ArtifactsPort,
  EmitterFactoryPort,
  ForkSpecIndexStorePort,
  RunIndexStorePort,
  SimServicePort,
} from "@lcase/ports";

import { getRunFlowHash } from "@lcase/run-history";
import { startForkedSim } from "@lcase/run-flow";

export class SimService implements SimServicePort {
  constructor(
    private readonly artifacts: ArtifactsPort,
    private readonly ef: EmitterFactoryPort,
    private readonly runIndexStore: RunIndexStorePort,
    private readonly forkSpecIndexStore: ForkSpecIndexStorePort,
  ) {}

  async startForkedRunSim(
    parentRunId: string,
    reuseSteps: string[],
    source: string,
  ) {
    const flowDefHash = await getRunFlowHash(parentRunId, this.runIndexStore);
    if (!flowDefHash) {
      console.log("error getting flow def hash from run index");
      return;
    }
    await startForkedSim(flowDefHash, parentRunId, reuseSteps, source, {
      ef: this.ef,
      artifacts: this.artifacts,
    });
  }

  async getAllForkSpecIndexes() {
    const forkSpecIndexes = await this.forkSpecIndexStore.getAll();
    return forkSpecIndexes;
  }
}

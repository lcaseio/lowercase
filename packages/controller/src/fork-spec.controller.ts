import type {
  ArtifactsPort,
  EmitterFactoryPort,
  EventBusPort,
  RunIndexStorePort,
} from "@lcase/ports";
import { startForkedSim } from "@lcase/run-flow";
import { getRunFlowHash } from "@lcase/run-history";

export class ForkSpecController {
  constructor(
    private readonly artifacts: ArtifactsPort,
    private readonly ef: EmitterFactoryPort,
    private readonly runIndexStore: RunIndexStorePort,
  ) {}

  async runForkedSim(
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
}

import {
  ArtifactsPort,
  EmitterFactoryPort,
  ForkSpecDetails,
  ForkSpecIndexStorePort,
  RunIndexStorePort,
  SimServicePort,
} from "@lcase/ports";

import { getRunFlowHash } from "@lcase/run-history";
import { startForkedSim } from "@lcase/run-flow";
import { ForkSpec, ForkSpecIndex, Result } from "@lcase/types";

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

  async saveForkSpec(
    details: ForkSpecDetails,
  ): Promise<Result<string, string>> {
    const result = await this.artifacts.putJson(details.forkSpec);
    if (!result.ok) return { ok: false, error: result.error.message };

    const forkSpecIndex: ForkSpecIndex = {
      flowDefHash: details.flowDefHash,
      name: details.name,
      forkSpecHash: result.value,
      ...(details.description ? { description: details.description } : {}),
    };
    const indexResult = await this.forkSpecIndexStore.put(forkSpecIndex);
    if (!indexResult.ok) return { ok: false, error: indexResult.error };
    return { ok: true, value: result.value };
  }
}

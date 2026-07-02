import type {
  ArtifactsPort,
  EmitterFactoryPort,
  FlowRepositoryPort,
  IndexStorePort,
  SimRepositoryPort,
  SimServicePort,
} from "@lcase/ports";
import type {
  CreateSimRecordInput,
  ForkSpec,
  Result,
  RunIndex,
  SimDefinition,
  SimListItem,
  SimRecord,
} from "@lcase/types";

import { getRunFlowHash } from "@lcase/run-history";
import { startForkedSim } from "@lcase/run-flow";

export class SimService implements SimServicePort {
  constructor(
    private readonly artifacts: ArtifactsPort,
    private readonly ef: EmitterFactoryPort,
    private readonly runIndexStore: IndexStorePort<RunIndex>,
    private readonly simRepository: SimRepositoryPort,
    private readonly flowRepository: FlowRepositoryPort,
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

  async getAllSims(): Promise<SimListItem[]> {
    return this.simRepository.listSimsWithFlowVersion();
  }

  async getSim(simId: string): Promise<Result<SimDefinition, string>> {
    const simResult = await this.simRepository.getSim(simId);
    if (!simResult.ok) return simResult;

    const specResult = await this.artifacts.getJson(simResult.value.forkSpecHash);
    if (!specResult.ok) {
      return { ok: false, error: specResult.error.message };
    }

    return {
      ok: true,
      value: {
        sim: simResult.value,
        spec: specResult.value as ForkSpec,
      },
    };
  }

  async saveSim(
    details: Omit<CreateSimRecordInput, "forkSpecHash"> & {
      forkSpec: ForkSpec;
    },
  ): Promise<Result<SimRecord, string>> {
    const versionResult = await this.flowRepository.getFlowVersion(
      details.flowVersionId,
    );
    if (!versionResult.ok) return versionResult;
    if (versionResult.value.flowId !== details.flowId) {
      return {
        ok: false,
        error: "Flow version does not belong to the supplied flow",
      };
    }

    const result = await this.artifacts.putJson(details.forkSpec);
    if (!result.ok) return { ok: false, error: result.error.message };

    return this.simRepository.createSim({
      name: details.name,
      forkSpecHash: result.value,
      flowId: details.flowId,
      flowVersionId: details.flowVersionId,
      description: details.description,
    });
  }
}

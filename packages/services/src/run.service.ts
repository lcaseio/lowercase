import {
  ArtifactsPort,
  EmitterFactoryPort,
  RunRequest,
  RunRepositoryPort,
  RunQueryPort,
  RunServicePort,
} from "@lcase/ports";
import { createRunId, runFlow } from "@lcase/run-flow";
import {
  Result,
  RunDetail,
  RunListItem,
  RunParamManifest,
} from "@lcase/types";

type RunServiceDeps = {
  artifacts: ArtifactsPort;
  ef: EmitterFactoryPort;
  runRepository: RunRepositoryPort;
  runQuery: RunQueryPort;
  // runParamsStore: RunParamsIndexStorePort;
};

export class RunService implements RunServicePort {
  private readonly artifacts: ArtifactsPort;
  private readonly ef: EmitterFactoryPort;
  private readonly runRepository: RunRepositoryPort;
  private readonly runQuery: RunQueryPort;
  // private readonly runParamsStore: RunParamsIndexStorePort;

  constructor(deps: RunServiceDeps) {
    this.artifacts = deps.artifacts;
    this.ef = deps.ef;
    this.runRepository = deps.runRepository;
    this.runQuery = deps.runQuery;
    // this.runParamsStore = deps.runParamsStore;
  }

  async requestRun(request: RunRequest) {
    const runId = request.runId ?? createRunId();
    const traceId = this.ef.generateTraceId();
    const runParamsHash = await this.#persistRunParamsManifest(request, runId);
    const result = await this.runRepository.createRun({
      id: runId,
      traceId,
      status: "requested",
      source: request.source,
      flowId: request.flowId,
      flowVersionId: request.flowVersionId,
      flowDefHash: request.flowDefHash,
      simId: request.simId,
      forkSpecHash: request.forkSpecHash,
      runParamsHash,
    });
    if (!result.ok) {
      throw new Error(result.error);
    }

    await runFlow({
      ...request,
      runId,
      traceId,
      ef: this.ef,
    });
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

  async getRunParams(runId: string): Promise<Result<RunParamManifest, string>> {
    const detail = await this.runQuery.getRunDetail(runId);
    if (!detail.ok) return { ok: false, error: detail.error };

    const params = detail.value.params;
    if (!params || params.length === 0) return { ok: true, value: {} };

    return {
      ok: true,
      value: Object.fromEntries(
        params.map((param) => [param.name, param.artifactHash]),
      ),
    };
  }

  async #persistRunParamsManifest(
    request: RunRequest,
    runId: string,
  ): Promise<string | undefined> {
    if (!request.params || Object.keys(request.params).length === 0) {
      return undefined;
    }

    const result = await this.artifacts.putJson(request.params, {
      label: `Run Params ${runId}`,
      filename: `${runId}-params.json`,
      contentType: "application/json",
    });

    if (!result.ok) {
      throw new Error(result.error.message);
    }

    return result.value;
  }

  // async getRunParamsIndex(runId: string): Promise<Result<RunParams, string>> {
  //   const runParams = await this.runParamsStore.getRunParams(runId);
  //   if (!runParams) return { ok: false, error: "Error getting run params" };
  //   return { ok: true, value: runParams };
  // }
}

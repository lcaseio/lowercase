import {
  ArtifactRepositoryPort,
  ArtifactsPort,
  EmitterFactoryPort,
  RunRequest,
  RunRepositoryPort,
  RunQueryPort,
  RunServicePort,
} from "@lcase/ports";
import { analyzeFlow, analyzeRefs } from "@lcase/flow-analysis";
import { createRunId, runFlow } from "@lcase/run-flow";
import {
  ArtifactIndex,
  FlowDefinition,
  FlowParamContentType,
  Ref,
  Result,
  RunDetail,
  RunListItem,
  RunParamManifest,
} from "@lcase/types";
import { FlowSchema } from "@lcase/specs";

type RunServiceDeps = {
  artifactRepository: ArtifactRepositoryPort;
  artifacts: ArtifactsPort;
  ef: EmitterFactoryPort;
  runRepository: RunRepositoryPort;
  runQuery: RunQueryPort;
  // runParamsStore: RunParamsIndexStorePort;
};

export class RunService implements RunServicePort {
  private readonly artifactRepository: ArtifactRepositoryPort;
  private readonly artifacts: ArtifactsPort;
  private readonly ef: EmitterFactoryPort;
  private readonly runRepository: RunRepositoryPort;
  private readonly runQuery: RunQueryPort;
  // private readonly runParamsStore: RunParamsIndexStorePort;

  constructor(deps: RunServiceDeps) {
    this.artifactRepository = deps.artifactRepository;
    this.artifacts = deps.artifacts;
    this.ef = deps.ef;
    this.runRepository = deps.runRepository;
    this.runQuery = deps.runQuery;
    // this.runParamsStore = deps.runParamsStore;
  }

  async requestRun(request: RunRequest) {
    await this.#validateRunRequest(request);

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

  async #validateRunRequest(request: RunRequest): Promise<void> {
    const flow = await this.#getFlowDefinition(request.flowDefHash);
    this.#validateStringParamRefs(flow);

    if (!request.params || Object.keys(request.params).length === 0) return;

    for (const [paramName, artifactHash] of Object.entries(request.params)) {
      const declaration = flow.params?.[paramName];
      if (!declaration) {
        throw new Error(`Undeclared run param: ${paramName}`);
      }

      const artifact = await this.artifactRepository.getArtifact(artifactHash);
      if (!artifact) {
        throw new Error(`Run param artifact not found: ${artifactHash}`);
      }

      if (!isArtifactCompatible(artifact, declaration.type)) {
        throw new Error(
          `Run param ${paramName} requires ${declaration.type}, received ${artifact.contentType ?? artifact.format ?? "unknown"}`,
        );
      }
    }
  }

  async #getFlowDefinition(flowDefHash: string): Promise<FlowDefinition> {
    const result = await this.artifacts.getJson(flowDefHash);
    if (!result.ok) {
      throw new Error(`Unable to load flow definition: ${result.error.message}`);
    }

    const parsed = FlowSchema.safeParse(result.value);
    if (!parsed.success) {
      throw new Error("Invalid flow definition");
    }

    return parsed.data;
  }

  #validateStringParamRefs(flow: FlowDefinition): void {
    const analysis = analyzeFlow(flow);
    analyzeRefs(flow, analysis);

    for (const ref of analysis.refs) {
      if (ref.scope !== "params") continue;
      const paramName = ref.valuePath[1];
      if (typeof paramName !== "string") continue;

      const declaration = flow.params?.[paramName];
      if (!declaration || declaration.type === "application/json") continue;
      if (ref.valuePath.length > 2) {
        throw new Error(
          `String-backed run param refs must target the whole value: ${ref.string}`,
        );
      }
    }
  }

  // async getRunParamsIndex(runId: string): Promise<Result<RunParams, string>> {
  //   const runParams = await this.runParamsStore.getRunParams(runId);
  //   if (!runParams) return { ok: false, error: "Error getting run params" };
  //   return { ok: true, value: runParams };
  // }
}

function isArtifactCompatible(
  artifact: ArtifactIndex,
  type: FlowParamContentType,
): boolean {
  if (artifact.contentType === type) return true;

  switch (type) {
    case "application/json":
      return artifact.format === "json";
    case "text/plain":
      return artifact.format === "text";
    case "text/markdown":
      return artifact.format === "markdown";
  }
}

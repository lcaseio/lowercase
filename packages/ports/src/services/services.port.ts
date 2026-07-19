import type {
  ArtifactIndex,
  ArtifactPutInput,
  AnyEvent,
  CreateSimRecordInput,
  GetFlowsRes,
  GetFlowVersionRes,
  GetFlowVersionsRes,
  FlowDefinition,
  CreateFlowRecordResult,
  EvalResultRecord,
  ForkSpec,
  Result,
  RunDetail,
  RunListItem,
  RunParamManifest,
  SimDefinition,
  SimListItem,
  SimRecord,
} from "@lcase/types";
import type { AutoGetResult } from "../artifacts/artifacts.port.js";
import type { EventSink } from "../observability/observability-sink.port.js";
import type { RuntimeStatus } from "../controller.port.js";
import { JsonValue } from "../artifacts/artifacts.port.js";

export interface ServicesPort {
  flow: FlowServicePort;
  sim: SimServicePort;
  replay: ReplayServicePort;
  system: SystemServicePort;
  run: RunServicePort;
  ws: WsServicePort;
  artifact: ArtifactServicePort;
  eval: EvalServicePort;
}

export interface SimServicePort {
  startForkedRunSim(
    parentRunId: string,
    reuseSteps: string[],
    source: string,
  ): Promise<void>;

  getAllSims(): Promise<SimListItem[]>;
  getSim(simId: string): Promise<Result<SimDefinition, string>>;
  saveSim(
    simDetails: Omit<CreateSimRecordInput, "forkSpecHash"> & {
      forkSpec: ForkSpec;
    },
  ): Promise<Result<SimRecord, string>>;
}

export interface FlowServicePort {
  validateJsonFlow(
    flow: string | Record<string, unknown>,
  ): FlowDefinition | string;
  storeFlowInCas(path: string): Promise<void>;
  addFlow(
    flow: string | FlowDefinition,
  ): Promise<Result<CreateFlowRecordResult, string>>;
  getAllFlows(): Promise<GetFlowsRes>;
  getFlowVersions(flowId: string): Promise<GetFlowVersionsRes>;
  getFlowVersionDef(flowVersionId: string): Promise<GetFlowVersionRes>;
  getFlowDef(flowIdOrHash: string): Promise<Result<FlowDefinition, string>>;
}
export interface ReplayServicePort {
  replayRun(runId: string): Promise<void>;
  getAllEvents(runId: string): Promise<{
    events: AnyEvent[];
  }>;
}

export interface SystemServicePort {
  startSystem(): Promise<RuntimeStatus>;
  stopSystem(): Promise<RuntimeStatus>;
  attachSink(sink: EventSink): void;
}

export type RunRequest = {
  flowId: string;
  flowVersionId: string;
  flowDefHash: string;
  source: string;
  runId?: string;
  simId?: string;
  forkSpecHash?: string;
  experimentId?: string;
  targetRunId?: string;
  targetStepId?: string;
  targetExportName?: string;
  params?: Record<string, string>;
};
export interface RunServicePort {
  requestRun(request: RunRequest): Promise<void>;
  makeRunId(): string;
  listAllRuns(): Promise<RunListItem[]>;
  listRunsByFlowVersionId(flowVersionId: string): Promise<RunListItem[]>;
  getRunDetail(runId: string): Promise<Result<RunDetail, string>>;
  getRunParams(runId: string): Promise<Result<RunParamManifest, string>>;
  // getRunParamsIndex(runId: string): Promise<Result<RunParams, string>>;
}

export type EvalTargetRef = {
  runId: string;
  stepId: string;
  exportName: string;
  paramName: string;
};

export type StartEvalRunRequest = {
  targets: EvalTargetRef[];
  evalFlowId: string;
  evalFlowVersionId: string;
  evalFlowDefHash: string;
  judgeSystemPromptHash: string;
  experimentId?: string;
  source: string;
};

export interface EvalServicePort {
  startEvalRun(
    request: StartEvalRunRequest,
  ): Promise<Result<{ evalRunId: string }, string>>;
  listByTargetShape(shape: {
    flowId: string;
    stepId: string;
    exportName: string;
  }): Promise<EvalResultRecord[]>;
  listByExperimentId(experimentId: string): Promise<EvalResultRecord[]>;
}

export interface WsServicePort {
  monitorRun(runId: string, socket: WebSocket): void;
  stopMonitoringRun(runId: string): void;
  start(): Promise<void>;
}

export interface ArtifactServicePort {
  getArtifact(hash: string): Promise<AutoGetResult>;
  listArtifacts(): Promise<ArtifactIndex[]>;
  putArtifact(input: ArtifactPutInput): Promise<Result<string, string>>;
}

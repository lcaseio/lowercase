import type {
  ArtifactIndex,
  ArtifactPutInput,
  AnyEvent,
  FlowDefinition,
  FlowIndex,
  ForkSpec,
  ForkSpecIndex,
  Result,
  RunIndex,
  RunListItem,
  RunParams,
} from "@lcase/types";
import type { AutoGetResult } from "../artifacts/artifacts.port.js";
import type { EventSink } from "../observability/observability-sink.port.js";
import type { RuntimeStatus } from "../controller.port.js";
import type { FlowList } from "../flow/list.type.js";
import { JsonValue } from "../artifacts/artifacts.port.js";

export interface ServicesPort {
  flow: FlowServicePort;
  sim: SimServicePort;
  replay: ReplayServicePort;
  system: SystemServicePort;
  run: RunServicePort;
  ws: WsServicePort;
  artifact: ArtifactServicePort;
}

export type ForkSpecDetails = {
  name: string;
  forkSpec: ForkSpec;
  flowDefHash: string;
  description?: string;
};
export interface SimServicePort {
  startForkedRunSim(
    parentRunId: string,
    reuseSteps: string[],
    source: string,
  ): Promise<void>;

  getAllForkSpecIndexes(): Promise<ForkSpecIndex[]>;
  getForkSpec(hash: string): Promise<Result<JsonValue, string>>;
  saveForkSpec(
    forkSpecDetails: ForkSpecDetails,
  ): Promise<Result<string, string>>;
}

export interface FlowServicePort {
  startFlow(args: { absoluteFilePath?: string }): Promise<void>;
  listFlows(args: { absoluteDirPath?: string }): Promise<FlowList>;
  validateJsonFlow(
    flow: string | Record<string, unknown>,
  ): FlowDefinition | string;
  storeFlowInCas(path: string): Promise<void>;
  addFlow(flow: string | FlowDefinition): Promise<Result<FlowIndex, string>>;
  getAllFlowIndexes(): Promise<Result<FlowIndex[], string>>;
  getFlowDef(hash: string): Promise<Result<FlowDefinition, string>>;
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
  flowDefHash: string;
  source: string;
  runId?: string;
  forkSpecHash?: string;
  params?: Record<string, string>;
};
export interface RunServicePort {
  requestRun(request: RunRequest): Promise<void>;
  makeRunId(): string;
  listAllRuns(): Promise<RunListItem[]>;
  getRunIndex(runId: string): Promise<Result<RunIndex, string>>;
  // getRunParamsIndex(runId: string): Promise<Result<RunParams, string>>;
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

import type { FlowRecord, FlowVersionRecord } from "./flow-record.js";
import type { ArtifactIndex } from "../artifacts/artifact-index.js";

export type RunStatus = "requested" | "started" | "completed" | "failed";

export type RunRecord = {
  id: string;
  traceId: string;
  status: RunStatus;
  source: string;
  flowId?: string;
  flowVersionId?: string;
  flowDefHash: string;
  simId?: string;
  parentRunId?: string;
  forkSpecHash?: string;
  runParamsHash?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateRunRecordInput = {
  id: string;
  traceId: string;
  status: RunStatus;
  source: string;
  flowDefHash: string;
  flowId?: string;
  flowVersionId?: string;
  simId?: string;
  parentRunId?: string;
  forkSpecHash?: string;
  runParamsHash?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
};

export type UpdateRunRecordInput = {
  id: string;
  status?: RunStatus;
  source?: string;
  flowId?: string;
  flowVersionId?: string;
  flowDefHash?: string;
  simId?: string;
  parentRunId?: string;
  forkSpecHash?: string;
  runParamsHash?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
};

export type RunStepProjectionRecord = {
  runId: string;
  stepId: string;
  status?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  reusedTime?: string;
  wasReused?: boolean;
  outputHash?: string;
  argsHash?: string;
  exportHashes?: Record<string, string>;
};

export type UpsertRunStepProjectionInput = RunStepProjectionRecord;

export type ReusableRunStepData = {
  stepId: string;
  status?: string;
  outputHash?: string;
  exportHashes?: Record<string, string>;
};

export type RunDetail = {
  run: RunRecord;
  steps: RunStepProjectionRecord[];
  params?: RunParamSelection[];
  flow?: FlowRecord;
  flowVersion?: FlowVersionRecord;
};

export type RunParamManifest = Record<string, string>;

export type RunParamSelection = {
  name: string;
  artifactHash: string;
  artifact?: ArtifactIndex;
};

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
  experimentId?: string;
  targetRunId?: string;
  targetStepId?: string;
  targetExportName?: string;
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
  experimentId?: string;
  targetRunId?: string;
  targetStepId?: string;
  targetExportName?: string;
  params?: Record<string, string>;
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
  experimentId?: string;
  targetRunId?: string;
  targetStepId?: string;
  targetExportName?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
};

export type RunStepExportRecord = {
  name: string;
  artifactHash: string;
  artifact?: ArtifactIndex;
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
  exports?: RunStepExportRecord[];
};

export type UpsertRunStepProjectionInput = {
  runId: string;
  stepId: string;
  status?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  reusedTime?: string;
  wasReused?: boolean;
  outputHash?: string;
  exportHashes?: Record<string, string>;
};

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

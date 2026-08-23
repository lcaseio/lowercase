export type RunRequestedData = {
  flowId: string;
  flowVersionId: string;
  flowDefHash: string;
  simId?: string;
  forkSpecHash?: string;
  experimentId?: string;
  targetRunId?: string;
  targetStepId?: string;
  targetExportName?: string;
  params?: Record<string, string>;
};
export type RunStartedData = null;
export type RunCompletedData = null;
export type RunFailedData = null;

export type RunDeniedData = {
  error: string;
};

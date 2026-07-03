import type { RunParams } from "../../engine/run-params.js";

type RunDescriptor = {
  run: {
    id: string;
    status: string;
  };
  engine: {
    id: string;
  };
};
export type RunRequestedData = {
  flowId: string;
  flowVersionId: string;
  flowDefHash: string;
  simId?: string;
  forkSpecHash?: string;
  params?: Record<string, string>;
};
export type RunStartedData = null;
export type RunCompletedData = null;
export type RunFailedData = null;

export type RunDeniedData = {
  error: string;
};

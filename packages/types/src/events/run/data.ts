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
  flowDefHash: string;
  forkSpecHash?: string;
};
export type RunStartedData = null;
export type RunCompletedData = null;
export type RunFailedData = null;

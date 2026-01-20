type RunDescriptor = {
  run: {
    id: string;
    status: string;
  };
  engine: {
    id: string;
  };
};

export type RunStartedData = null;
export type RunCompletedData = null;
export type RunFailedData = null;

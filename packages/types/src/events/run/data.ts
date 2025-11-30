type RunDescriptor = {
  run: {
    id: string;
    status: string;
  };
  engine: {
    id: string;
  };
};

export type RunStartedData = RunDescriptor & {
  status: "started";
};
export type RunCompletedData = RunDescriptor & {
  status: "success";
  message: string;
};

export type RunFailedData = RunDescriptor & {
  status: "failure";
  message: string;
};

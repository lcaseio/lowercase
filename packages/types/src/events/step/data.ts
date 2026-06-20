export type StepDescriptor = {
  step: {
    id: string;
    name: string;
    type: string;
    joinFrom?: string[];
    parallelSteps?: string[];
  };
};

export type StepPlannedData = StepDescriptor;
export type StepStartedData = StepDescriptor & {
  status: "started";
};

export type StepCompletedData = StepDescriptor & {
  status: "success";
  outputHash?: string;
  exportHashes?: Record<string, string>;
};

export type StepFailedData = StepDescriptor & {
  status: "failure";
  outputHash?: string;
  exportHashes?: Record<string, string>;
  reason: string;
};

export type StepReusedData = {
  status: "success" | "failure";
  outputHash?: string;
  exportHashes?: Record<string, string>;
  sourceRunId: string;
};

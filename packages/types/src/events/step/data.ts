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
  // only set on "branch" steps: the resolved routing decision,
  // null meaning it fell through to the mandatory default case
  matchedCase?: string | null;
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

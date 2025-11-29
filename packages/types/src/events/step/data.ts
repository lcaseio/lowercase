export type StepDescriptor = {
  step: {
    id: string;
    name: string;
    type: string;
  };
};
export type StepStartedData = StepDescriptor & {
  status: "started";
};

export type StepCompletedData = StepDescriptor & {
  status: "success";
};

export type StepFailedData = StepDescriptor & {
  status: "failure";
  reason: string;
};

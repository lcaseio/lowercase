import { FlowDefinition } from "../../flow/flow-definition.js";

export type FlowDescriptor = {
  flow: {
    id: string;
    name: string;
    version: string;
  };
};

export type FlowQueuedData = FlowDescriptor & {
  flowName: string;
  inputs: Record<string, unknown>;
  test?: boolean;
  outfile: string;
  definition: unknown;
};

export type FlowSubmittedData = FlowDescriptor & {
  inputs: Record<string, unknown>;
  definition: FlowDefinition;
};

export type FlowStartedData = FlowDescriptor & {};
export type FlowCompletedData = FlowDescriptor & {
  status: "success";
};
export type FlowFailedData = FlowDescriptor & {
  status: "failure";
};

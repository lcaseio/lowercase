import { FlowAnalysis } from "../../flow-analysis/types.js";
import { FlowDefinition } from "../../flow/flow-definition.js";

export type FlowDescriptor = {
  flow: {
    id: string;
    name: string;
    version: string;
  };
  run: { id: string };
};

export type FlowQueuedData = FlowDescriptor & {
  flowName: string;
  inputs: Record<string, unknown>;
  outfile: string;
  definition: FlowDefinition;
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

export type FlowAnalyzedData = FlowDescriptor & {
  analysis: FlowAnalysis;
};

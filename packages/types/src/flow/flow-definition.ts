import { StepDefinition } from "./step.type.js";

export type FlowParamContentType =
  "application/json" | "text/plain" | "text/markdown";

export type FlowParamDefinition = {
  type: FlowParamContentType;
  optional?: true;
};

export type FlowKind = "business" | "eval";

export type FlowDefinition = {
  name: string;
  version: string;
  description?: string;
  kind?: FlowKind;
  params?: Record<string, FlowParamDefinition>;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  start: string;
  steps: Record<string, StepDefinition>;
};

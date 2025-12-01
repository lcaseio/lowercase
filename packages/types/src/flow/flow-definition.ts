import { StepDefinition } from "./step.type.js";

export type FlowDefinition = {
  name: string;
  version: string;
  description?: string;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  start: string;
  steps: Record<string, StepDefinition>;
};

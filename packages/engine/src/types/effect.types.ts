import { CloudScope, StepReusedData, StepScope } from "@lcase/types";

export type GetFlowDefFx = {
  type: "GetFlowDef";
  hash: string;
  runId: string;
};
export type GetForkSpecFx = {
  type: "GetForkSpec";
  hash: string;
  runId: string;
};

export type GetRunIndexFx = {
  type: "GetRunIndex";
  parentRunId: string;
  runId: string;
};

export type MakeRunPlanFx = {
  type: "MakeRunPlan";
  runId: string;
};

export type EmitStepReusedFx = {
  type: "EmitStepReused";
  scope: StepScope & CloudScope;
  data: StepReusedData;
  traceId: string;
};

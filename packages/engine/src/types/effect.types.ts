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
  runId: string;
};

export type MakeRunPlanFx = {
  type: "MakeRunPlan";
  runId: string;
};

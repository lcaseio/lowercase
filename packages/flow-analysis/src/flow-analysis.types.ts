type StepId = string;

export type EdgeType = "control" | "join";
export type EdgeGate = "always" | "onSuccess" | "onFailure";

export type Edge = {
  from: StepId;
  to: StepId;
  type: EdgeType;
  gate: EdgeGate;
};

export type FlowAnalysis = {
  nodes: StepId[];

  inEdges: Record<StepId, Edge[]>;
  outEdges: Record<StepId, Edge[]>;

  joinReqs: Record<StepId, StepId[]>;

  problems?: FlowProblem[];
};

export type UnknownStepReferenceProblem = {
  type: "UnknownStepReference";
  from: StepId;
  to: StepId;
};

export type DuplicateStepIdProblem = {
  type: "DuplicateStepId";
  stepId: StepId;
};

export type SelfReferencedProblem = {
  type: "SelfReferenced";
  stepId: StepId;
};

export type FlowProblem =
  | UnknownStepReferenceProblem
  | DuplicateStepIdProblem
  | SelfReferencedProblem;

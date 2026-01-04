type StepId = string;

export type EdgeType = "control" | "join";
export type EdgeGate = "always" | "onSuccess" | "onFailure";
type EdgeId = string;

export type Edge = {
  startStepId: StepId;
  endStepId: StepId;
  type: EdgeType;
  gate: EdgeGate;
};

export type OutEdges = Record<StepId, Edge[]>;
export type InEdges = Record<StepId, Edge[]>;

export type FlowAnalysis = {
  nodes: StepId[];

  inEdges: InEdges;
  outEdges: OutEdges;

  joinReqs: Record<StepId, StepId[]>;

  problems?: FlowProblem[];
};

export type UnknownStepReferenceProblem = {
  type: "UnknownStepReference";
  startStepId: StepId;
  endStepId: StepId;
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

export type ProblemType = FlowProblem["type"];

type StepId = string;

// ed
export type EdgeType = "control" | "join";
export type EdgeGate = "always" | "onSuccess" | "onFailure";

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

  joinDeps: Record<StepId, StepId[]>;

  problems?: FlowProblem[];
};

/*-- problem types for flor analysis to surface in UI/validation --*/
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

/*-- --*/
export type Path = Array<string | number>;
export type Ref = {
  path: Path;
  scope: "steps" | "input" | "env";
  stepId: StepId;
  stepPath: Path;
  string: string;
};

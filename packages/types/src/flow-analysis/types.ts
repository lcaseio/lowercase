type StepId = string;

export type EdgeType = "control" | "join" | "parallel";
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

  problems: FlowProblem[];
  refs: Ref[];
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

export type InvalidRefScopeProblem = {
  type: "InvalidRefScope";
  stepId: StepId;
  stepPath: Path;
  refString: string;
};
export type InvalidRefStepIdProblem = {
  type: "InvalidRefStepId";
  ref: Ref;
  targetStepId: StepId;
};
export type UnreachableRefProblem = {
  type: "UnreachableRef";
  ref: Ref;
  targetStepId: StepId;
};

export type FlowProblem =
  | UnknownStepReferenceProblem
  | DuplicateStepIdProblem
  | SelfReferencedProblem
  | InvalidRefStepIdProblem
  | UnreachableRefProblem
  | InvalidRefScopeProblem;

export type ProblemType = FlowProblem["type"];

export type Path = Array<string | number>;
export type Ref = {
  path: Path;
  scope: "steps" | "input" | "env";
  stepId: StepId;
  stepPath: Path;
  string: string;
  interpolated: boolean;
};

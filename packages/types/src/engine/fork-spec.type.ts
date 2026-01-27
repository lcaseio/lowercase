type OutputHash = string;
type StepId = string;

/**
 * Spec for deriving forked run behavior.
 * Currently has properties more specific to a Simulation Spec, in terms
 * of execution details, but for now we are just modeling a specific case
 * when forking an existing run + simulation in one type.  May become a
 * broaders simulation spec over time.
 */
export type ForkSpec = {
  parentRunId: string;
  reuse: string[];
  // flowDefMode: FlowDefMode;
  // forceRerunSteps: string[];
  // cascade: boolean;
  // stepOutputOverrides?: Record<StepId, OutputHash>;
};

export type FlowDefMode =
  | { mode: "inherit" }
  | {
      mode: "override";
      hash: string;
    };

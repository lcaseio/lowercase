type StepId = string;
type OutputHash = string;
export type RunPlan = {
  reuse: Record<
    StepId,
    {
      outputHash?: OutputHash;
      status: string;
    }
  >;
};

export type StepBranch = {
  type: "branch";
  value: string;
  cases: Record<string, string>;
  default: string;
};

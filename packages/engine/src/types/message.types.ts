import type { AnyEvent } from "@lcase/types";

export type StepPlannedMsg = {
  type: "StepPlanned";
  event: AnyEvent<"step.planned">;
};
export type StepStartedMsg = {
  type: "StepStarted";
  event: AnyEvent<"step.started">;
};

export type JoinStepPlannedMsg = {
  type: "JoinStepPlanned";
};

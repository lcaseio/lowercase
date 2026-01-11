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

export type StepCompletedMsg = {
  type: "StepCompleted";
  event: AnyEvent<"step.completed">;
};

export type StepFailedMsg = {
  type: "StepFailed";
  event: AnyEvent<"step.failed">;
};

export type StepFinishedMsg = {
  type: "StepFinished";
  event: AnyEvent<"step.completed"> | AnyEvent<"step.failed">;
};

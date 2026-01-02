import type { AnyEvent } from "@lcase/types";

export type StepPlannedMsg = {
  type: "StepPlanned";
  event: AnyEvent<"step.planned">;
};

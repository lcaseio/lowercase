import { useMemo } from "react";
import type { AnyEvent } from "@lcase/types";

export type StepStatus = "pending" | "running" | "completed" | "failed";

const STATUS_EVENT_TYPES = new Set([
  "step.started",
  "step.completed",
  "step.failed",
  "step.reused",
]);

export function deriveStepStatuses(
  events: AnyEvent[],
  stepIds: string[],
): Record<string, StepStatus> {
  const statuses: Record<string, StepStatus> = Object.fromEntries(
    stepIds.map((id) => [id, "pending"]),
  );
  for (const event of events) {
    if (!STATUS_EVENT_TYPES.has(event.type)) continue;
    const stepId = (event as AnyEvent & { stepid?: string }).stepid;
    if (!stepId || !(stepId in statuses)) continue;
    const status = (
      event as unknown as { data: { status: "started" | "success" | "failure" } }
    ).data.status;
    statuses[stepId] =
      status === "started" ? "running" : status === "success" ? "completed" : "failed";
  }
  return statuses;
}

export function useStepStatuses(
  events: AnyEvent[],
  stepIds: string[],
): Record<string, StepStatus> {
  return useMemo(() => deriveStepStatuses(events, stepIds), [events, stepIds]);
}

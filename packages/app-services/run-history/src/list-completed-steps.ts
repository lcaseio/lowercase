import type { RunIndex } from "@lcase/ports";

/**
 * Looks through a run index and returns a list of step ids who's stats
 * is equal to "success".
 *
 * @param index RunIndex
 * @returns string[] (array of stepId strings)
 */
export function listCompletedSteps(index: RunIndex): string[] {
  const steps: string[] = [];
  for (const stepId in index.steps) {
    if (index.steps[stepId].status === "success") steps.push(stepId);
  }
  return steps;
}

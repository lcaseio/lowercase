import type { Ref } from "@lcase/types";
import type { RunContext } from "@lcase/types";

/**
 * Makes an array of value ref objects for a list of references.
 * This should be added to job event payloads and processed later by the
 * worker to resolve JSON paths to a value locally.
 *
 * Only processes template references which refer to step outputs.
 * Does not yet support inputs or other resolutions.
 *
 * @param refs Template strings parsed by flow analysis in reference object form
 * @param runContext The run context within the engine.
 * @returns ValueRef[] array of value ref objects
 */
export function makeStepRefs(
  stepId: string,
  allRefs: Ref[],
  stepContext: RunContext["steps"],
): Ref[] {
  const stepRefs = getStepRefs(allRefs, stepId);

  const jobRefs: Ref[] = [];
  for (const ref of stepRefs) {
    // if reference is not a {{steps.x.output}} format, skip.
    if (ref.scope !== "steps") continue;
    const jobRef: Ref = {
      ...ref,
      valuePath: ref.valuePath.slice(3), // remove "steps.stepId.output" from path
      hash: getStepRefHash(ref, stepContext),
    };
    jobRefs.push(jobRef);
  }
  return jobRefs;
}

/**
 * Get the hash value from previous step outputs, from run context.
 * Only works with step output references.  Used in conjunction with
 * makeStepValueRefs create value ref arrays, specific data structures meant to
 * be processed by the worker to resolve json tree values from a content
 * addressable storage through an "artifacts" system.
 *
 * @param ref
 * @param runContext
 * @returns string of the hash or null if reference is empty
 */
export function getStepRefHash(
  ref: Ref,
  stepContext: RunContext["steps"],
): string | null {
  if (ref.scope === "steps" && stepContext[ref.valuePath[1]] !== undefined) {
    return stepContext[ref.valuePath[1]].outputHash;
  } else return null;
}

/**
 * Convenience filter function for matching references to stepIds
 * @param refs References to search though
 * @param stepId StepId to match
 * @returns Ref[] which have ref.stepId === stepId
 */
export function getStepRefs(refs: Ref[], stepId: string) {
  const stepRefs = refs.filter((ref) => ref.stepId === stepId);
  return stepRefs;
}

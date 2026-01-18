import type { Ref, ValueRef } from "@lcase/types";
import type { RunContext } from "@lcase/types/engine";

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
export function makeStepValueRefs(
  stepId: string,
  allRefs: Ref[],
  stepContext: RunContext["steps"]
): ValueRef[] {
  const stepRefs = getStepRefs(allRefs, stepId);

  const valueRefs: ValueRef[] = [];
  for (const ref of stepRefs) {
    // if reference is not a {{steps.x.}} format, skip.
    if (ref.scope !== "steps") continue;
    const vr: ValueRef = {
      valuePath: ref.path,
      dataPath: ref.stepPath,
      string: ref.string,
      interpolated: ref.interpolated,
      hash: getStepRefHash(ref, stepContext),
    };
    valueRefs.push(vr);
  }
  return valueRefs;
}

/**
 * Get the hash value from previous step outputs, from run context.
 * Only works with step output references.  Used in conjunction with
 * makeValueRefs create value ref arrays, specific data structures meant to
 * be processed by the worker to resolve json tree values from a content
 * addressable storage through an "artifacts" system.
 *
 * @param ref
 * @param runContext
 * @returns string of the hash or null if reference is empty
 */
export function getStepRefHash(
  ref: Ref,
  stepContext: RunContext["steps"]
): string | null {
  if (ref.scope === "steps" && stepContext[ref.path[1]] !== undefined) {
    return stepContext[ref.path[1]].outputHash;
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

import type {
  FlowAnalysis,
  FlowDefinition,
  FlowProblem,
  Ref,
} from "@lcase/types";
import { parseStepRefs } from "./parse-references.js";

/**
 * Takes a flow definition, loops through steps, parses, and adds references
 * found in step definitions to the provided flow analysis object.
 * @param fd FlowDefinition object
 * @param fa FlowAnalysis object
 * @returns FlowAnalysis
 */
export function analyzeRefs(fd: FlowDefinition, fa: FlowAnalysis) {
  for (const stepId of Object.keys(fd.steps)) findAndParseRefs(stepId, fd, fa);

  for (const ref of fa.refs) {
    const problem = validateRefTargetStep(ref, fd, fa);
    if (problem) (fa.problems ??= []).push(problem);
  }
  return fa;
}

/**
 * Parses the references found within a single step.  Adds the reference and
 * problems to the flow analysis provided.
 * @param stepId StepId string
 * @param fd FlowDefinition
 * @param fa FlowAnalysis
 */
export function findAndParseRefs(
  stepId: string,
  fd: FlowDefinition,
  fa: FlowAnalysis
) {
  const { refs, problems } = parseStepRefs(fd.steps[stepId], stepId);
  fa.refs = fa.refs.concat(refs);
  fa.problems = (fa.problems ?? []).concat(problems);
}

/**
 * Checks to see if a reference refers to a valid stepId, and that there is a
 * reachable path between the target step in the reference, and the step which
 * holds the reference.  Edges represent dependencies in terms of execution
 * order, and we just see that a path is possible with isReachable().
 * @param ref Reference object
 * @param fd FlowDefinition object
 * @param fa FlowAnalysis object
 * @returns FlowProblem | undefined if no problem was found
 */
export function validateRefTargetStep(
  ref: Ref,
  fd: FlowDefinition,
  fa: FlowAnalysis
): FlowProblem | undefined {
  // check and see if its a step scope, that the step exists
  if (ref.scope !== "steps") return;
  const targetStepId = ref.string.split(".")[1];

  if (targetStepId === undefined || fd.steps[targetStepId] === undefined) {
    return {
      type: "InvalidRefStepId",
      ref,
      targetStepId,
    };
  }
  const reachable = isReachable(ref.stepId, targetStepId, fa);
  if (!reachable) {
    return {
      type: "UnreachableRef",
      ref,
      targetStepId,
    };
  }
}
/**
 * Recursively checks out edges from the target stepId to the stepId with the
 * reference.  A depth first type sort.
 * @param refStepId StepId the reference lives in
 * @param targetStepId StepId the reference references (targets)
 * @param fa The FlowAnalysis
 * @returns true if its reachable, false if not
 */
export function isReachable(
  refStepId: string,
  targetStepId: string,
  fa: FlowAnalysis
): boolean {
  if (!fa.outEdges[targetStepId]) return false;
  for (const outEdge of fa.outEdges[targetStepId]) {
    if (outEdge.endStepId === refStepId) return true;
    if (isReachable(refStepId, outEdge.endStepId, fa)) return true;
  }
  return false;
}

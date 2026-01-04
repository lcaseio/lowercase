import type {
  FlowDefinition,
  StepDefinition,
  StepHttpJson,
  StepMcp,
  StepParallel,
  StepJoin,
} from "@lcase/types";
import type {
  Edge,
  FlowAnalysis,
  FlowProblem,
  InEdges,
  OutEdges,
} from "./flow-analysis.types.js";

/**
 * Given a flow definition, it looks at each steps dependencies and dependents.
 * In the language of the analyzer, inEdges are dependencies for a step (node).
 * outEdges are dependents for a step (node).  Just easier to understand from
 * any step's point of view.
 *
 * Builds those edges, and saves the nodes.  Saves an array of "problems" for
 * when duplicate stepIds are found, or invalid references are made.
 *
 * This will need to grow and combine with a system that also searches for
 * interpolated strings inside flow definitions, so see if they refer to
 * proper steps.
 *
 * This should also be combined with DAG output, probably to be used in some
 * engine execution contexts during stitched replay, where only some steps are
 * rerun, and others frozen.  A DAG could help solve the problem of execution
 * order when that occurs.  Meaning, follow it, but skip over the frozen steps.
 * And continue until done.
 *
 * But here for now we are just calculating edges for the engine to easily see
 * what possible steps are being waited on, and which ones might be next.
 *
 * This pure function core logic should be usable within UI or CLI layers in
 * addition to the engine in the future.
 *
 * @param flow
 * @returns FlowAnalysis object
 */
export function analyzeFlow(flow: FlowDefinition): FlowAnalysis {
  const fa: FlowAnalysis = {
    inEdges: {},
    outEdges: {},
    nodes: [],
    joinReqs: {},
    problems: [],
  };

  for (const stepId in flow.steps) {
    const step = flow.steps[stepId];
    if (fa.nodes.includes(stepId)) {
      addProblem({ type: "DuplicateStepId", stepId }, (fa.problems ??= []));
      continue;
    }
    fa.nodes.push(stepId);

    if (step.type === "parallel") {
      addParallelEdges(stepId, step, fa, flow);
      continue;
    }
    if (step.type === "join") {
      addJoinEdges(stepId, step, fa, flow);
      continue;
    }
    if (step.type === "httpjson" || step.type === "mcp") {
      addCapEdges(stepId, step, fa, flow);
    }
  }

  return fa;
}

export function addParallelEdges(
  stepId: string,
  step: StepParallel,
  fa: FlowAnalysis,
  flow: FlowDefinition
) {
  for (const endStepId of step.steps) {
    const hasProblems = checkAndAddProblems(
      flow.steps[endStepId],
      (fa.problems ??= []),
      stepId
    );
    if (hasProblems) continue;

    addEdge(fa.inEdges, fa.outEdges, {
      type: "control",
      gate: "always",
      startStepId: stepId,
      endStepId,
    });
  }
}

export function addJoinEdges(
  stepId: string,
  step: StepJoin,
  fa: FlowAnalysis,
  flow: FlowDefinition
) {
  for (const startStepId of step.steps) {
    const hasProblems = checkAndAddProblems(
      flow.steps[startStepId],
      (fa.problems ??= []),
      startStepId,
      stepId
    );
    if (hasProblems) continue;

    addEdge(fa.inEdges, fa.outEdges, {
      startStepId,
      endStepId: stepId,
      type: "join",
      gate: "always",
    });
  }

  const hasProblems = checkAndAddProblems(
    flow.steps[step.next],
    (fa.problems ??= []),
    stepId,
    step.next
  );
  if (hasProblems) return;
  addEdge(fa.inEdges, fa.outEdges, {
    startStepId: stepId,
    endStepId: step.next,
    type: "join",
    gate: "onSuccess",
  });
}

export function addCapEdges(
  stepId: string,
  step: StepMcp | StepHttpJson,
  fa: FlowAnalysis,
  flow: FlowDefinition
) {
  if (step.on?.success) {
    const hasProblems = checkAndAddProblems(
      flow.steps[step.on.success],
      (fa.problems ??= []),
      stepId,
      step.on.success
    );
    if (!hasProblems) {
      addEdge(fa.inEdges, fa.outEdges, {
        startStepId: stepId,
        endStepId: step.on.success,
        type: "control",
        gate: "onSuccess",
      });
    }
  }
  if (step.on?.failure) {
    const hasProblems = checkAndAddProblems(
      flow.steps[step.on.failure],
      (fa.problems ??= []),
      stepId,
      step.on.failure
    );
    if (!hasProblems) {
      addEdge(fa.inEdges, fa.outEdges, {
        startStepId: stepId,
        endStepId: step.on.failure,
        type: "control",
        gate: "onFailure",
      });
    }
  }
}

export function checkAndAddProblems(
  step: StepDefinition | undefined,
  problems: FlowProblem[],
  startStepId: string,
  endStepId?: string
): boolean {
  if (!step) {
    addProblem(
      {
        type: "UnknownStepReference",
        startStepId: startStepId,
        endStepId: endStepId ?? "unknown",
      },
      problems
    );
    return true;
  }
  if (startStepId === endStepId) {
    addProblem(
      {
        type: "SelfReferenced",
        stepId: startStepId,
      },
      problems
    );
    return true;
  }
  return false;
}

export function addProblem<T extends FlowProblem>(
  fields: T,
  problems: FlowProblem[]
): FlowProblem[] {
  problems.push({ ...fields });
  return problems;
}

export function addEdge(inEdges: InEdges, outEdges: OutEdges, edge: Edge) {
  (inEdges[edge.endStepId] ??= []).push(edge);
  (outEdges[edge.startStepId] ??= []).push(edge);
}

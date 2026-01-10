import type {
  EmitJobHttpJsonSubmittedFx,
  EmitStepPlannedFx,
  EmitStepStartedFx,
  EngineEffect,
  EngineState,
  Planner,
} from "../engine.types.js";
import type { StepStartedMsg } from "../types/message.types.js";

export const stepStartedPlanner: Planner<StepStartedMsg> = (
  oldState: EngineState,
  newState: EngineState,
  message: StepStartedMsg
) => {
  const effects: EngineEffect[] = [];
  const runId = message.event.runid;
  const flowId = message.event.flowid;
  const stepId = message.event.stepid;
  const stepType = message.event.steptype;

  const newRunState = newState.runs[runId];

  if (!newRunState) return effects;
  const flowDef = newState.flows[flowId];
  if (!flowDef) return effects;

  const fa = newRunState.flowAnalysis;

  const stepDef = flowDef.definition.steps[stepId];
  if (!stepDef) return effects;

  if (stepType === "parallel") {
    for (const edge of fa.outEdges[stepId]) {
      const step = newRunState.steps[edge.endStepId];
      if (!step) continue;
      if (step.status !== "planned") continue;
      const emitStepPlanned: EmitStepPlannedFx = {
        type: "EmitStepPlanned",
        scope: {
          flowid: flowId,
          runid: runId,
          source: "lowercase://engine",
          stepid: stepId,
          steptype: stepType,
        },
        data: {
          step: {
            id: stepId,
            name: stepId,
            type: stepType,
          },
        },
        traceId: newRunState.traceId,
      };
      effects.push(emitStepPlanned);
    }
  }

  return effects;
};

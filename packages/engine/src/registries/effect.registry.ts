import { emitFlowAnalyzedFx } from "../effects/emit-flow-analyzed.effect.js";
import { emitFlowCompletedFx } from "../effects/emit-flow-completed.effect.js";
import { emitFlowFailedFx } from "../effects/emit-flow-failed.effect.js";
import { emitJobHttpJsonSubmittedFx } from "../effects/emit-job-httpjson-submitted.effect.js";
import { emitJobMcpSubmittedFx } from "../effects/emit-job-mcp-submitted.effect.js";
import { emitRunCompletedFx } from "../effects/emit-run-completed.effect.js";
import { emitRunFailedFx } from "../effects/emit-run-failed.effect.js";
import { emitRunStartedFx } from "../effects/emit-run-started.effect.js";
import { emitStepCompletedFx } from "../effects/emit-step-completed.effect.js";
import { emitStepFailedFx } from "../effects/emit-step-failed.effect.js";
import { emitStepPlannedFx } from "../effects/emit-step-planned.effect.js";
import { emitStepStartedFx } from "../effects/emit-step-started.effect.js";
import { writeContextToDiskFx } from "../effects/write-context-to-disk.effect.js";
import type {
  EffectHandlerDeps,
  EffectHandlerRegistry,
  EmitFlowAnalyzedFx,
  EmitFlowCompletedFx,
  EmitFlowFailedFx,
  EmitJobHttpJsonSubmittedFx,
  EmitJobMcpSubmittedFx,
  EmitRunCompletedFx,
  EmitRunFailedFx,
  EmitRunStartedFx,
  EmitStepCompletedFx,
  EmitStepFailedFx,
  EmitStepPlannedFx,
  EmitStepStartedFx,
  WriteContextToDiskFx,
} from "../engine.types.js";

/**
 * Wires up the effect handlers into an object literal key value methods.
 * Keys are the `type` field in effect objects.
 * Wraps effect handles to provide deps to all functions, but expose a version
 * that only takes an effect after wiring.
 * Used in engine to lookup which effect handlers to execute.
 * @param deps EffectHandlerDeps
 * @returns EffectHandlerRegistry object
 */
export function wireEffectHandlers(deps: EffectHandlerDeps) {
  return {
    // flow
    EmitFlowAnalyzed: async (effect: EmitFlowAnalyzedFx) =>
      emitFlowAnalyzedFx(effect, deps),
    EmitFlowCompleted: async (effect: EmitFlowCompletedFx) =>
      emitFlowCompletedFx(effect, deps),
    EmitFlowFailed: async (effect: EmitFlowFailedFx) =>
      emitFlowFailedFx(effect, deps),
    // run
    EmitRunStarted: async (effect: EmitRunStartedFx) =>
      emitRunStartedFx(effect, deps),
    EmitRunCompleted: async (effect: EmitRunCompletedFx) =>
      emitRunCompletedFx(effect, deps),
    EmitRunFailed: async (effect: EmitRunFailedFx) =>
      emitRunFailedFx(effect, deps),
    // step
    EmitStepPlanned: async (effect: EmitStepPlannedFx) =>
      emitStepPlannedFx(effect, deps),
    EmitStepStarted: async (effect: EmitStepStartedFx) =>
      emitStepStartedFx(effect, deps),
    EmitStepCompleted: async (effect: EmitStepCompletedFx) =>
      emitStepCompletedFx(effect, deps),
    EmitStepFailed: async (effect: EmitStepFailedFx) =>
      emitStepFailedFx(effect, deps),
    // job
    EmitJobHttpJsonSubmitted: async (effect: EmitJobHttpJsonSubmittedFx) =>
      emitJobHttpJsonSubmittedFx(effect, deps),
    EmitJobMcpSubmitted: async (effect: EmitJobMcpSubmittedFx) =>
      emitJobMcpSubmittedFx(effect, deps),
    // write to disk
    WriteContextToDisk: async (effect: WriteContextToDiskFx) =>
      writeContextToDiskFx(effect, deps),
  } satisfies EffectHandlerRegistry;
}

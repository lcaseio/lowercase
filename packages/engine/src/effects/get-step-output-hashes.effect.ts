import type {
  EffectHandler,
  EffectHandlerDeps,
  EmitFlowAnalyzedFx,
} from "../engine.types.js";
import { getStepOutputHashes } from "@lcase/run-history";

export const emitFlowAnalyzedFx: EffectHandler<"EmitFlowAnalyzed"> = async (
  effect: EmitFlowAnalyzedFx,
  deps: EffectHandlerDeps,
) => {
  const hashes = await getStepOutputHashes(
    ["stepId"],
    "runId",
    deps.runIndexStore,
  );
};

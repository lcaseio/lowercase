import type { EffectHandler, EffectHandlerDeps } from "../engine.types.js";
import type { GetRunIndexFx } from "../types/effect.types.js";
import { RunIndexResultMsg } from "../types/message.types.js";

export const getRunIndexFx: EffectHandler<"GetRunIndex"> = async (
  effect: GetRunIndexFx,
  deps: EffectHandlerDeps,
) => {
  const index = await deps.runIndexStore.getRunIndex(effect.parentRunId);

  if (index) {
    const message: RunIndexResultMsg = {
      type: "RunIndexResult",
      ok: true,
      runId: effect.runId,
      runIndex: index,
    };
    deps.enqueue(message);
    deps.processAll();
  } else {
    const message: RunIndexResultMsg = {
      type: "RunIndexResult",
      ok: false,
      error: `Error getting run index for parentRunId: ${effect.parentRunId}`,
      runId: effect.runId,
    };
    deps.enqueue(message);
    deps.processAll();
  }
};

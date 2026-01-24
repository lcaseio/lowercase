import { ForkSpec } from "@lcase/types";
import { EffectHandler, EffectHandlerDeps } from "../engine.types.js";
import { GetForkSpecFx } from "../types/effect.types.js";
import { ForkSpecResultMsg } from "../types/message.types.js";

export const getForkSpec: EffectHandler<"GetForkSpec"> = async (
  effect: GetForkSpecFx,
  deps: EffectHandlerDeps,
) => {
  const json = await deps.artifacts.getJson(effect.hash);
  if (json.ok) {
    const message: ForkSpecResultMsg = {
      type: "FlowSpecResult",
      ok: true,
      forkSpec: json.value as ForkSpec, // parse later once fork-spec app-service exists
      runId: effect.runId,
    };
    deps.enqueue(message);
    deps.processAll();
  } else {
    const message: ForkSpecResultMsg = {
      type: "FlowSpecResult",
      ok: false,
      error: json.error.message,
      runId: effect.runId,
    };
    deps.enqueue(message);
    deps.processAll();
  }
};

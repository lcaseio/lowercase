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
    console.log("got fork spec:");
    console.log(json.value);
    const message: ForkSpecResultMsg = {
      type: "ForkSpecResult",
      ok: true,
      forkSpec: json.value as ForkSpec, // parse later once fork-spec app-service exists
      runId: effect.runId,
    };
    deps.enqueue(message);
    deps.processAll();
  } else {
    console.log("error getting fork spec");
    const message: ForkSpecResultMsg = {
      type: "ForkSpecResult",
      ok: false,
      error: json.error.message,
      runId: effect.runId,
    };
    deps.enqueue(message);
    deps.processAll();
  }
};

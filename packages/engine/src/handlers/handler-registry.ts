import { EmitterFactoryPort } from "@lcase/ports";
import {
  EffectHandler,
  EmitEventFx,
  EmitFlowFailedFx,
  EmitFlowStartedFx,
  EmitJobHttpjsonSubmittedFx,
  EmitStepStartedFx,
  EngineEffect,
} from "../engine.types.js";
import { randomUUID } from "crypto";

export type EffectHandlerRegistry = {
  [K in EngineEffect["kind"]]?: EffectHandler<K>;
};

export function wireEffectHandlers(
  ef: EmitterFactoryPort
): EffectHandlerRegistry {
  const source = "lowercase://engine";
  const handlers = {
    EmitEvent: function (effect: EmitEventFx): void | Promise<void> {
      throw new Error("Function not implemented.");
    },

    EmitFlowStartedEvent: function (
      effect: EmitFlowStartedFx
    ): void | Promise<void> {
      const emitter = ef.newFlowEmitterNewSpan(
        {
          flowid: effect.data.flow.id,
          source,
        },
        effect.traceId
      );
      void emitter.emit("flow.started", { flow: effect.data.flow });
    },

    EmitStepStarted: (effect: EmitStepStartedFx) => {
      const emitter = ef.newStepEmitterNewSpan(effect.scope, effect.traceId);
      emitter.emit("step.started", effect.data);
    },

    EmitJobHttpjsonSubmittedEvent: function (
      effect: EmitJobHttpjsonSubmittedFx
    ): void {
      effect.data.pipe = {};
      const jobId = String(randomUUID());
      const emitter = ef.newJobEmitterNewSpan(
        {
          ...effect.scope,
          jobid: jobId,
        },
        effect.traceId
      );

      void emitter.emit("job.httpjson.submitted", effect.data);
      return;
    },

    EmitFlowFailed: function (effect: EmitFlowFailedFx): void {
      const jobId = String(randomUUID());
      const emitter = ef.newFlowEmitterNewSpan(
        {
          ...effect.scope,
        },
        effect.traceId
      );

      void emitter.emit("flow.failed", effect.data);
      return;
    },
  } satisfies EffectHandlerRegistry;

  return handlers;
}

import { EmitterFactoryPort } from "@lcase/ports";
import {
  EffectHandler,
  EmitEventFx,
  EmitFlowCompletedFx,
  EmitFlowFailedFx,
  EmitFlowStartedFx,
  EmitJobHttpJsonSubmittedFx,
  EmitJobMcpSubmittedFx,
  EmitJoinStepStartedFx,
  EmitStepCompletedFx,
  EmitStepFailedFx,
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
      void emitter.emit("flow.started", effect.data);
    },

    EmitStepStarted: (effect: EmitStepStartedFx) => {
      const emitter = ef.newStepEmitterNewSpan(effect.scope, effect.traceId);
      emitter.emit("step.started", effect.data);
    },
    EmitStepCompleted: (effect: EmitStepCompletedFx) => {
      const emitter = ef.newStepEmitterNewSpan(effect.scope, effect.traceId);
      emitter.emit("step.completed", effect.data);
    },
    EmitStepFailed: (effect: EmitStepFailedFx) => {
      const emitter = ef.newStepEmitterNewSpan(effect.scope, effect.traceId);
      emitter.emit("step.failed", effect.data);
    },
    EmitJoinStepStarted: (effect: EmitJoinStepStartedFx) => {
      const emitter = ef.newStepEmitterNewSpan(effect.scope, effect.traceId);
      emitter.emit("step.started", effect.data);
    },

    EmitJobHttpjsonSubmittedEvent: function (
      effect: EmitJobHttpJsonSubmittedFx
    ): void {
      effect.data.pipe = {};
      const jobId = String(randomUUID());
      effect.data.job.id = jobId;
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

    EmitJobMcpSubmittedEvent: function (effect: EmitJobMcpSubmittedFx): void {
      effect.data.pipe = {};
      const jobId = String(randomUUID());
      effect.data.job.id = jobId;
      const emitter = ef.newJobEmitterNewSpan(
        {
          ...effect.scope,
          jobid: jobId,
        },
        effect.traceId
      );

      void emitter.emit("job.mcp.submitted", effect.data);
      return;
    },

    EmitFlowFailed: function (effect: EmitFlowFailedFx): void {
      const emitter = ef.newFlowEmitterNewSpan(effect.scope, effect.traceId);
      void emitter.emit("flow.failed", effect.data);
    },
    EmitFlowCompleted: function (effect: EmitFlowCompletedFx): void {
      const emitter = ef.newFlowEmitterNewSpan(effect.scope, effect.traceId);
      void emitter.emit("flow.completed", effect.data);
    },
  } satisfies EffectHandlerRegistry;

  return handlers;
}

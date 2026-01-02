import { describe, expect, it, vi } from "vitest";
import { EmitterFactoryPort } from "@lcase/ports";
import { emitStepPlannedFx } from "../../src/effects/emit-step-planned.effect.js";
import type {
  EffectHandlerDeps,
  EmitStepPlannedFx,
} from "../../src/engine.types.js";

describe("emitStepPlannedFx", () => {
  it("creates an emitter and emits with the correct args", async () => {
    const emit = vi.fn().mockReturnValue({});
    const newStepEmitterNewSpan = vi.fn().mockReturnValue({ emit });
    const ef = { newStepEmitterNewSpan } as unknown as EmitterFactoryPort;
    const effect = {
      type: "EmitStepPlanned",
      scope: {
        flowid: "test-flowid",
        runid: "test-runid",
        source: "test-source",
        stepid: "test-stepid",
        steptype: "test-steptype",
      },
      data: {
        step: {
          id: "test-step.id",
          name: "test-step.name",
          type: "test-step.type",
        },
      },
      traceId: "test-traceid",
    } satisfies EmitStepPlannedFx;

    await emitStepPlannedFx(effect, { ef } as EffectHandlerDeps);

    expect(newStepEmitterNewSpan).toHaveBeenCalledExactlyOnceWith(
      effect.scope,
      "test-traceid"
    );
    expect(emit).toHaveBeenCalledExactlyOnceWith("step.planned", effect.data);
  });
});

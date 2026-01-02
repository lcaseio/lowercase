import { describe, expect, it, vi } from "vitest";
import { emitRunStartedFx } from "../../src/effects/emit-run-started.effect.js";
import type {
  EffectHandlerDeps,
  EmitRunStartedFx,
} from "../../src/engine.types.js";
import { EmitterFactoryPort } from "@lcase/ports";

describe("flowSubmittedEffect", () => {
  it("creates an emitter and emits with the correct args", async () => {
    const emit = vi.fn().mockReturnValue({});
    const newRunEmitterNewSpan = vi.fn().mockReturnValue({ emit });
    const ef = { newRunEmitterNewSpan } as unknown as EmitterFactoryPort;
    const effect = {
      type: "EmitRunStarted",
      eventType: "run.started",
      data: null,
      scope: {
        flowid: "test-flowid",
        runid: "test-runid",
        source: "lowercase://engine",
      },
      traceId: "test-traceid",
    } satisfies EmitRunStartedFx;

    await emitRunStartedFx(effect, { ef } as EffectHandlerDeps);

    expect(newRunEmitterNewSpan).toHaveBeenCalledExactlyOnceWith({
      ...effect.scope,
      traceid: "test-traceid",
    });
    expect(emit).toHaveBeenCalledExactlyOnceWith("run.started", null);
  });
});

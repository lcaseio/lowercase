import { describe, it, expect, vi } from "vitest";
import { emitWorkerProfileAdded } from "../../src/effects/emit-worker-profile-added.effect";
import type { EmitWorkerProfileAddedFx } from "../../src/scheduler.types.js";
import type { SchedulerEffectDeps } from "../../src/registries/effect.registry";

describe("workerProfileAddedEffect", () => {
  it("emits a worker.profile.added event", () => {
    const effect = {
      type: "EmitWorkerProfileAdded",
      data: {
        status: "accepted",
        ok: true,
      },
      scope: {
        source: "lowercase://rm",
        workerid: "",
      },
      traceId: "",
    } satisfies EmitWorkerProfileAddedFx;

    const emit = vi.fn().mockReturnValue({});
    const newWorkerEmitterNewSpan = vi.fn().mockReturnValue({ emit });
    const ef = { newWorkerEmitterNewSpan };
    const deps = { ef } as unknown as SchedulerEffectDeps;
    emitWorkerProfileAdded(effect, deps);
    expect(newWorkerEmitterNewSpan).toHaveBeenCalledExactlyOnceWith(
      effect.scope,
      effect.traceId
    );
    expect(emit).toHaveBeenCalledExactlyOnceWith(
      "worker.profile.added",
      effect.data
    );
  });
});

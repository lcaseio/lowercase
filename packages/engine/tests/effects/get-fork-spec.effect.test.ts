import { describe, expect, it, vi } from "vitest";
import type { ArtifactsPort } from "@lcase/ports";
import type { EffectHandlerDeps } from "../../src/engine.types.js";
import { getForkSpec } from "../../src/effects/get-fork-spec.effect.js";
import { GetForkSpecFx } from "../../src/types/effect.types.js";
import { ForkSpecResultMsg } from "../../src/types/message.types.js";
import { ForkSpec } from "@lcase/types";

const forkSpec: ForkSpec = {
  parentRunId: "test-parentrunid",
  reuse: ["b"],
};

describe("getForkSpecFx()", () => {
  it("parses and enqueues the correct message given a valid fork definition", async () => {
    const message: ForkSpecResultMsg = {
      ok: true,
      forkSpec,
      runId: "test-runid",
      type: "ForkSpecResult",
    };

    const returnValue = { ok: true, value: message.forkSpec };
    const getJson = vi.fn().mockResolvedValue(returnValue);
    const enqueue = vi.fn().mockReturnValue(undefined) as (
      message: string,
    ) => void;
    const processAll = vi.fn().mockReturnValue(undefined) as () => void;

    const artifacts = { getJson } as unknown as ArtifactsPort;
    const effect: GetForkSpecFx = {
      type: "GetForkSpec",
      hash: "test-forkspechash",
      runId: "test-runid",
    };

    await getForkSpec(effect, {
      artifacts,
      enqueue,
      processAll,
    } as unknown as EffectHandlerDeps);

    expect(getJson).toHaveBeenCalledExactlyOnceWith("test-forkspechash");
    expect(enqueue).toHaveBeenCalledExactlyOnceWith(message);
  });
  it("emits an error ForkSpecResult when getting the json fails", async () => {
    const message: ForkSpecResultMsg = {
      ok: false,
      runId: "test-runid",
      error: "test-forkspecerror",
      type: "ForkSpecResult",
    };

    const returnValue = { ok: false, error: { message: message.error } };
    const getJson = vi.fn().mockResolvedValue(returnValue);
    const enqueue = vi.fn().mockReturnValue(undefined) as (
      message: string,
    ) => void;
    const processAll = vi.fn().mockReturnValue(undefined) as () => void;

    const artifacts = { getJson } as unknown as ArtifactsPort;
    const effect: GetForkSpecFx = {
      type: "GetForkSpec",
      hash: "test-forkspechash",
      runId: "test-runid",
    };

    await getForkSpec(effect, {
      artifacts,
      enqueue,
      processAll,
    } as unknown as EffectHandlerDeps);

    expect(getJson).toHaveBeenCalledExactlyOnceWith("test-forkspechash");
    expect(enqueue).toHaveBeenCalledExactlyOnceWith(message);
  });
});

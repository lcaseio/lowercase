import { describe, expect, it, vi } from "vitest";
import type { ArtifactsPort, RunIndexStorePort } from "@lcase/ports";
import type { EffectHandlerDeps } from "../../src/engine.types.js";
import { getRunIndexFx } from "../../src/effects/get-run-index.effect.js";
import { GetForkSpecFx, GetRunIndexFx } from "../../src/types/effect.types.js";
import {
  ForkSpecResultMsg,
  RunIndexResultMsg,
} from "../../src/types/message.types.js";
import { ForkSpec } from "@lcase/types";

const forkSpec: ForkSpec = {
  parentRunId: "test-parentrunid",
  reuse: ["b"],
};

describe("getRunIndexFx()", () => {
  it("parses and enqueues the correct message given a valid run index store result", async () => {
    const message: RunIndexResultMsg = {
      ok: true,
      runId: "test-runid",
      runIndex: {
        flowId: "test-flowdefhash",
        traceId: "test-traceid",
        steps: {},
      },
      type: "RunIndexResult",
    };
    const returnValue = { ok: true, value: message.runIndex };
    const getRunIndex = vi.fn().mockResolvedValue(message.runIndex);
    const enqueue = vi.fn().mockReturnValue(undefined) as (
      message: string,
    ) => void;
    const processAll = vi.fn().mockReturnValue(undefined) as () => void;

    const runIndexStore = { getRunIndex } as unknown as RunIndexStorePort;

    const effect: GetRunIndexFx = {
      type: "GetRunIndex",
      parentRunId: "test-parentrunid",
      runId: "test-runid",
    };

    await getRunIndexFx(effect, {
      runIndexStore,
      enqueue,
      processAll,
    } as unknown as EffectHandlerDeps);

    expect(getRunIndex).toHaveBeenCalledExactlyOnceWith("test-parentrunid");
    expect(enqueue).toHaveBeenCalledExactlyOnceWith(message);
  });
  it("parses and enqueues the an error message given an invalid run index store result", async () => {
    const message: RunIndexResultMsg = {
      ok: false,
      runId: "test-runid",
      type: "RunIndexResult",
      error: "Error getting run index for parentRunId: test-parentrunid",
    };

    const getRunIndex = vi.fn().mockResolvedValue(undefined);
    const enqueue = vi.fn().mockReturnValue(undefined) as (
      message: string,
    ) => void;
    const processAll = vi.fn().mockReturnValue(undefined) as () => void;

    const runIndexStore = { getRunIndex } as unknown as RunIndexStorePort;

    const effect: GetRunIndexFx = {
      type: "GetRunIndex",
      parentRunId: "test-parentrunid",
      runId: "test-runid",
    };

    await getRunIndexFx(effect, {
      runIndexStore,
      enqueue,
      processAll,
    } as unknown as EffectHandlerDeps);

    expect(getRunIndex).toHaveBeenCalledExactlyOnceWith("test-parentrunid");
    expect(enqueue).toHaveBeenCalledExactlyOnceWith(message);
  });
});

import { describe, expect, it, vi } from "vitest";
import type { ArtifactsPort } from "@lcase/ports";
import type { EffectHandlerDeps } from "../../src/engine.types.js";
import { getFlowDefFx } from "../../src/effects/get-flow-def.effect.js";
import { GetFlowDefFx } from "../../src/types/effect.types.js";
import { FlowDefResultMsg } from "../../src/types/message.types.js";
import { FlowDefinition } from "@lcase/types";

const flowDef: FlowDefinition = {
  name: "test-flowname",
  version: "test-flowversion",
  description: "test-flowdescription",
  inputs: {},
  outputs: {},
  start: "parallel",
  steps: {
    parallel: {
      type: "parallel",
      steps: ["b"],
    },
    b: {
      type: "httpjson",
      url: "test-url",
    },
  },
};

describe("getFlowDefFx()", () => {
  it("parses and enqueues the correct message given a valid flow definition", async () => {
    const message: FlowDefResultMsg = {
      ok: true,
      def: flowDef,
      runId: "test-runid",
      type: "FlowDefResult",
    };

    const returnValue = { ok: true, value: message.def };
    const getJson = vi.fn().mockResolvedValue(returnValue);
    const enqueue = vi.fn().mockReturnValue(undefined) as (
      message: string,
    ) => void;
    const processAll = vi.fn().mockReturnValue(undefined) as () => void;

    const artifacts = { getJson } as unknown as ArtifactsPort;
    const effect: GetFlowDefFx = {
      type: "GetFlowDef",
      hash: "test-flowdefhash",
      runId: "test-runid",
    };

    await getFlowDefFx(effect, {
      artifacts,
      enqueue,
      processAll,
    } as unknown as EffectHandlerDeps);

    expect(getJson).toHaveBeenCalledExactlyOnceWith("test-flowdefhash");
    expect(enqueue).toHaveBeenCalledExactlyOnceWith(message);
  });

  it("creates error result message json is not a valid flow definition", async () => {
    const message: FlowDefResultMsg = {
      ok: false,
      runId: "test-runid",
      type: "FlowDefResult",
      error: "test-error-message",
    };

    const returnValue = { ok: false, error: { message: "test-error-message" } };
    const getJson = vi.fn().mockResolvedValue(returnValue);
    const enqueue = vi.fn().mockReturnValue(undefined) as (
      message: string,
    ) => void;
    const processAll = vi.fn().mockReturnValue(undefined) as () => void;

    const artifacts = { getJson } as unknown as ArtifactsPort;
    const effect: GetFlowDefFx = {
      type: "GetFlowDef",
      hash: "test-flowdefhash",
      runId: "test-runid",
    };

    await getFlowDefFx(effect, {
      artifacts,
      enqueue,
      processAll,
    } as unknown as EffectHandlerDeps);

    expect(getJson).toHaveBeenCalledExactlyOnceWith("test-flowdefhash");
    expect(enqueue).toHaveBeenCalledExactlyOnceWith(message);
  });
  it("creates error result message json is not a valid flow definition", async () => {
    const badFlowDef = {
      name: "test-flowname",
      version: "test-flowversion",
      description: "test-flowdescription",
      inputs: {},
      outputs: {},

      steps: {
        parallel: {
          type: "parallel",
          steps: ["b"],
        },
        b: {
          type: "httpjson",
          url: "test-url",
        },
      },
    } as unknown as FlowDefinition;
    const message: FlowDefResultMsg = {
      ok: false,
      error: `[
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "start"
    ],
    "message": "Required"
  }
]`,
      runId: "test-runid",
      type: "FlowDefResult",
    };

    const returnValue = { ok: true, value: badFlowDef };
    const getJson = vi.fn().mockResolvedValue(returnValue);
    const enqueue = vi.fn().mockReturnValue(undefined) as (
      message: string,
    ) => void;
    const processAll = vi.fn().mockReturnValue(undefined) as () => void;

    const artifacts = { getJson } as unknown as ArtifactsPort;
    const effect: GetFlowDefFx = {
      type: "GetFlowDef",
      hash: "test-flowdefhash",
      runId: "test-runid",
    };

    await getFlowDefFx(effect, {
      artifacts,
      enqueue,
      processAll,
    } as unknown as EffectHandlerDeps);

    expect(getJson).toHaveBeenCalledExactlyOnceWith("test-flowdefhash");
    expect(enqueue).toHaveBeenCalledExactlyOnceWith(message);
  });
});

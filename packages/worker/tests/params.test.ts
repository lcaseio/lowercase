import { describe, expect, it, vi } from "vitest";
import type {
  ArtifactsPort,
  EventBusPort,
  JobParserPort,
  QueuePort,
  StreamRegistryPort,
} from "@lcase/ports";
import type { ExportRef, ToolId } from "@lcase/types";
import { Worker } from "../src/worker.js";
import { ToolRegistry } from "@lcase/tools";
import type { Ref } from "@lcase/types";

function makeWorker(artifacts: ArtifactsPort) {
  return new Worker("workerId", {
    bus: {} as EventBusPort,
    queue: {} as QueuePort,
    emitterFactory: {} as never,
    streamRegistry: {} as StreamRegistryPort,
    toolRegistry: {
      listToolIds: () => [] as ToolId[],
      getBinding: () => undefined,
    } as unknown as ToolRegistry<ToolId>,
    jobParser: {} as JobParserPort,
    artifacts,
  });
}

describe("worker param binding", () => {
  it("binds param refs from json artifacts", async () => {
    const getJson = vi.fn().mockResolvedValue({
      ok: true,
      value: {
        answer: 42,
      },
    });
    const worker = makeWorker({
      getJson,
    } as unknown as ArtifactsPort);

    const refs: Ref[] = [
      {
        valuePath: ["answer"],
        scope: "params",
        stepId: "step",
        bindPath: ["body"],
        string: "params.payload.answer",
        interpolated: false,
        hash: "payload-hash",
      },
    ];
    const data: Record<string, unknown> = {
      body: null,
    };

    await worker.bindValueRefs(refs, data);

    expect(data.body).toBe(42);
    expect(getJson).toHaveBeenCalledWith("payload-hash");
  });

  it("binds text params as full strings", async () => {
    const getText = vi.fn().mockResolvedValue({
      ok: true,
      value: "hello prompt",
    });
    const worker = makeWorker({
      getText,
    } as unknown as ArtifactsPort);

    const refs: Ref[] = [
      {
        valuePath: [],
        scope: "params",
        stepId: "step",
        bindPath: ["body"],
        string: "params.prompt",
        interpolated: false,
        hash: "prompt-hash",
        paramType: "text/plain",
      },
    ];
    const data: Record<string, unknown> = {
      body: null,
    };

    await worker.bindValueRefs(refs, data);

    expect(data.body).toBe("hello prompt");
    expect(getText).toHaveBeenCalledWith("prompt-hash");
  });

  it("binds markdown params as full strings", async () => {
    const getMarkdown = vi.fn().mockResolvedValue({
      ok: true,
      value: "# prompt",
    });
    const worker = makeWorker({
      getMarkdown,
    } as unknown as ArtifactsPort);

    const refs: Ref[] = [
      {
        valuePath: [],
        scope: "params",
        stepId: "step",
        bindPath: ["body"],
        string: "params.prompt",
        interpolated: false,
        hash: "prompt-hash",
        paramType: "text/markdown",
      },
    ];
    const data: Record<string, unknown> = {
      body: null,
    };

    await worker.bindValueRefs(refs, data);

    expect(data.body).toBe("# prompt");
    expect(getMarkdown).toHaveBeenCalledWith("prompt-hash");
  });
});

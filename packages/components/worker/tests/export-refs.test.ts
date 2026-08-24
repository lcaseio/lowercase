import { describe, expect, it, vi } from "vitest";
import type {
  ArtifactsPort,
  EventBusPort,
  JobParserPort,
  QueuePort,
  StreamRegistryPort,
} from "@lcase/ports";
import type { ToolId } from "@lcase/types";
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

describe("worker downstream export binding", () => {
  it("binds text/plain exports as full strings", async () => {
    const getText = vi.fn().mockResolvedValue({
      ok: true,
      value: "the export text",
    });
    const worker = makeWorker({ getText } as unknown as ArtifactsPort);

    const refs: Ref[] = [
      {
        valuePath: [],
        scope: "steps",
        stepId: "step",
        bindPath: ["body"],
        string: "steps.upstream.exports.summary",
        interpolated: false,
        hash: "summary-hash",
        exportType: "text/plain",
      },
    ];
    const data: Record<string, unknown> = { body: null };

    await worker.bindValueRefs(refs, data);

    expect(data.body).toBe("the export text");
    expect(getText).toHaveBeenCalledWith("summary-hash");
  });

  it("binds text/markdown exports as full strings", async () => {
    const getMarkdown = vi.fn().mockResolvedValue({
      ok: true,
      value: "# the export markdown",
    });
    const worker = makeWorker({ getMarkdown } as unknown as ArtifactsPort);

    const refs: Ref[] = [
      {
        valuePath: [],
        scope: "steps",
        stepId: "step",
        bindPath: ["body"],
        string: "steps.upstream.exports.report",
        interpolated: false,
        hash: "report-hash",
        exportType: "text/markdown",
      },
    ];
    const data: Record<string, unknown> = { body: null };

    await worker.bindValueRefs(refs, data);

    expect(data.body).toBe("# the export markdown");
    expect(getMarkdown).toHaveBeenCalledWith("report-hash");
  });

  it("falls back to json binding when exportType is application/json", async () => {
    const getJson = vi.fn().mockResolvedValue({
      ok: true,
      value: { nested: { value: 42 } },
    });
    const worker = makeWorker({ getJson } as unknown as ArtifactsPort);

    const refs: Ref[] = [
      {
        valuePath: ["nested", "value"],
        scope: "steps",
        stepId: "step",
        bindPath: ["body"],
        string: "steps.upstream.exports.tree.nested.value",
        interpolated: false,
        hash: "tree-hash",
        exportType: "application/json",
      },
    ];
    const data: Record<string, unknown> = { body: null };

    await worker.bindValueRefs(refs, data);

    expect(data.body).toBe(42);
    expect(getJson).toHaveBeenCalledWith("tree-hash");
  });
});

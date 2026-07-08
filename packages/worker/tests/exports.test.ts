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

describe("worker exports", () => {
  it("stores named export artifacts from output json", async () => {
    const putJson = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, value: "parsed-hash" });
    const worker = makeWorker({ putJson } as unknown as ArtifactsPort);

    const exportRefs: Record<string, ExportRef> = {
      parsed: {
        exportName: "parsed",
        valuePath: ["output", "choices", 0, "message", "content"],
        scope: "output",
        string: "output.choices[0].message.content",
        type: "application/json",
      },
    };

    const result = await worker.storeExportArtifacts(
      {
        choices: [
          {
            message: {
              content: '{"ok":true}',
            },
          },
        ],
      },
      exportRefs,
    );

    expect(result).toEqual({
      ok: true,
      hashes: {
        parsed: "parsed-hash",
      },
    });
    expect(putJson).toHaveBeenCalledWith({ ok: true });
  });

  it("fails when a json export cannot be parsed", async () => {
    const putJson = vi.fn();
    const worker = makeWorker({ putJson } as unknown as ArtifactsPort);

    const exportRefs: Record<string, ExportRef> = {
      parsed: {
        exportName: "parsed",
        valuePath: ["output", "message"],
        scope: "output",
        string: "output.message",
        type: "application/json",
      },
    };

    const result = await worker.storeExportArtifacts(
      {
        message: "not-json",
      },
      exportRefs,
    );

    expect(result.ok).toBe(false);
    expect(putJson).not.toHaveBeenCalled();
  });

  it("stores a json export as-is when it is already a data structure", async () => {
    const putJson = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, value: "tree-hash" });
    const worker = makeWorker({ putJson } as unknown as ArtifactsPort);

    const exportRefs: Record<string, ExportRef> = {
      tree: {
        exportName: "tree",
        valuePath: ["output", "data"],
        scope: "output",
        string: "output.data",
        type: "application/json",
      },
    };

    const result = await worker.storeExportArtifacts(
      { data: { nested: { value: 1 } } },
      exportRefs,
    );

    expect(result).toEqual({ ok: true, hashes: { tree: "tree-hash" } });
    expect(putJson).toHaveBeenCalledWith({ nested: { value: 1 } });
  });

  it("stores a text/plain export as the raw string", async () => {
    const putText = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, value: "text-hash" });
    const worker = makeWorker({ putText } as unknown as ArtifactsPort);

    const exportRefs: Record<string, ExportRef> = {
      summary: {
        exportName: "summary",
        valuePath: ["output", "message"],
        scope: "output",
        string: "output.message",
        type: "text/plain",
      },
    };

    const result = await worker.storeExportArtifacts(
      { message: "hello world" },
      exportRefs,
    );

    expect(result).toEqual({ ok: true, hashes: { summary: "text-hash" } });
    expect(putText).toHaveBeenCalledWith("hello world");
  });

  it("stores a text/markdown export as the raw string", async () => {
    const putMarkdown = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, value: "markdown-hash" });
    const worker = makeWorker({ putMarkdown } as unknown as ArtifactsPort);

    const exportRefs: Record<string, ExportRef> = {
      report: {
        exportName: "report",
        valuePath: ["output", "message"],
        scope: "output",
        string: "output.message",
        type: "text/markdown",
      },
    };

    const result = await worker.storeExportArtifacts(
      { message: "# Heading" },
      exportRefs,
    );

    expect(result).toEqual({ ok: true, hashes: { report: "markdown-hash" } });
    expect(putMarkdown).toHaveBeenCalledWith("# Heading");
  });

  it("stores a json export that satisfies its declared schema", async () => {
    const putJson = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, value: "valid-hash" });
    const worker = makeWorker({ putJson } as unknown as ArtifactsPort);

    const exportRefs: Record<string, ExportRef> = {
      data: {
        exportName: "data",
        valuePath: ["output", "data"],
        scope: "output",
        string: "output.data",
        type: "application/json",
        schema: {
          type: "object",
          properties: { location: { type: "string" } },
          required: ["location"],
        },
      },
    };

    const result = await worker.storeExportArtifacts(
      { data: { location: "Seattle" } },
      exportRefs,
    );

    expect(result).toEqual({ ok: true, hashes: { data: "valid-hash" } });
    expect(putJson).toHaveBeenCalledWith({ location: "Seattle" });
  });

  it("fails when a json export does not satisfy its declared schema", async () => {
    const putJson = vi.fn();
    const worker = makeWorker({ putJson } as unknown as ArtifactsPort);

    const exportRefs: Record<string, ExportRef> = {
      data: {
        exportName: "data",
        valuePath: ["output", "data"],
        scope: "output",
        string: "output.data",
        type: "application/json",
        schema: {
          type: "object",
          properties: { location: { type: "string" } },
          required: ["location"],
        },
      },
    };

    const result = await worker.storeExportArtifacts(
      { data: { intent: "weather" } },
      exportRefs,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("data");
      expect(result.message).toContain("schema validation");
    }
    expect(putJson).not.toHaveBeenCalled();
  });

  it("fails when a text/markdown export resolves to a non-string value", async () => {
    const putMarkdown = vi.fn();
    const worker = makeWorker({ putMarkdown } as unknown as ArtifactsPort);

    const exportRefs: Record<string, ExportRef> = {
      report: {
        exportName: "report",
        valuePath: ["output", "message"],
        scope: "output",
        string: "output.message",
        type: "text/markdown",
      },
    };

    const result = await worker.storeExportArtifacts(
      { message: { not: "a string" } },
      exportRefs,
    );

    expect(result.ok).toBe(false);
    expect(putMarkdown).not.toHaveBeenCalled();
  });
});

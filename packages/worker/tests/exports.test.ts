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
        json: true,
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
        json: true,
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
});

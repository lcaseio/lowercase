import { describe, expect, it, vi } from "vitest";
import { RunService } from "../src/run.service.js";
import type {
  ArtifactRepositoryPort,
  ArtifactsPort,
  EmitterFactoryPort,
  RunQueryPort,
  RunRepositoryPort,
} from "@lcase/ports";
import type { FlowDefinition, RunEvent } from "@lcase/types";

function makeEmitterFactory() {
  const emit = vi.fn().mockResolvedValue({} as RunEvent<"run.requested">);
  return {
    generateTraceId: () => "trace-id",
    generateSpanId: () => "span-id",
    makeTraceParent: () => "trace-parent",
    newRunEmitter: () => ({ emit }),
  } as unknown as EmitterFactoryPort;
}

function makeRunService(options?: {
  flow?: FlowDefinition;
  artifact?: { contentType?: string; format?: "json" | "text" | "markdown" | "bytes" };
}) {
  const flow =
    options?.flow ??
    ({
      name: "Prompt Flow",
      version: "v1",
      params: {
        prompt: { type: "text/markdown" },
      },
      start: "fetch",
      steps: {
        fetch: {
          type: "httpjson",
          url: "{{params.prompt}}",
        },
      },
    } satisfies FlowDefinition);

  const artifacts = {
    getJson: vi.fn().mockImplementation(async (hash: string) => {
      if (hash === "flow-hash") {
        return { ok: true as const, value: flow };
      }
      return {
        ok: false as const,
        error: { code: "STORE_GET_FAILED" as const, message: "missing" },
      };
    }),
    putJson: vi.fn().mockResolvedValue({ ok: true, value: "manifest-hash" }),
  } as unknown as ArtifactsPort;

  const artifactRepository = {
    getArtifact: vi.fn().mockResolvedValue({
      hash: "artifact-hash",
      time: new Date().toISOString(),
      ...options?.artifact,
    }),
  } as unknown as ArtifactRepositoryPort;

  const runRepository = {
    createRun: vi.fn().mockResolvedValue({
      ok: true,
      value: {
        id: "run-1",
        traceId: "trace-id",
        status: "requested",
        source: "lowercase://test",
        flowDefHash: "flow-hash",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }),
  } as unknown as RunRepositoryPort;

  const runQuery = {} as RunQueryPort;

  return {
    service: new RunService({
      artifactRepository,
      artifacts,
      ef: makeEmitterFactory(),
      runRepository,
      runQuery,
    }),
    artifacts,
    artifactRepository,
    runRepository,
  };
}

describe("RunService", () => {
  it("accepts compatible markdown param artifacts", async () => {
    const { service, runRepository } = makeRunService({
      artifact: {
        contentType: "text/markdown",
        format: "markdown",
      },
    });

    await expect(
      service.requestRun({
        flowId: "flow-1",
        flowVersionId: "flow-version-1",
        flowDefHash: "flow-hash",
        source: "lowercase://test",
        runId: "run-1",
        params: {
          prompt: "artifact-hash",
        },
      }),
    ).resolves.toBeUndefined();

    expect(runRepository.createRun).toHaveBeenCalledOnce();
  });

  it("rejects incompatible param artifact formats", async () => {
    const { service } = makeRunService({
      artifact: {
        contentType: "application/json",
        format: "json",
      },
    });

    await expect(
      service.requestRun({
        flowId: "flow-1",
        flowVersionId: "flow-version-1",
        flowDefHash: "flow-hash",
        source: "lowercase://test",
        runId: "run-1",
        params: {
          prompt: "artifact-hash",
        },
      }),
    ).rejects.toThrow(
      "Run param prompt requires text/markdown, received application/json",
    );
  });

  it("rejects nested refs for string-backed params", async () => {
    const { service } = makeRunService({
      artifact: {
        contentType: "text/markdown",
        format: "markdown",
      },
      flow: {
        name: "Prompt Flow",
        version: "v1",
        params: {
          prompt: { type: "text/plain" },
        },
        start: "fetch",
        steps: {
          fetch: {
            type: "httpjson",
            url: "{{params.prompt.answer}}",
          },
        },
      },
    });

    await expect(
      service.requestRun({
        flowId: "flow-1",
        flowVersionId: "flow-version-1",
        flowDefHash: "flow-hash",
        source: "lowercase://test",
        runId: "run-1",
        params: {
          prompt: "artifact-hash",
        },
      }),
    ).rejects.toThrow(
      "String-backed run param refs must target the whole value: params.prompt.answer",
    );
  });
});

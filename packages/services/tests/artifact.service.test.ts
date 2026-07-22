import { describe, expect, it, vi } from "vitest";
import { ArtifactService } from "../src/artifact.service.js";
import type {
  ArtifactRepositoryPort,
  ArtifactsPort,
  FlowRepositoryPort,
} from "@lcase/ports";
import type { FlowDefinition } from "@lcase/types";

function makeArtifactService(options?: {
  flow?: FlowDefinition;
  associateArtifact?: ReturnType<typeof vi.fn>;
}) {
  const flow =
    options?.flow ??
    ({
      name: "Weather Flow",
      version: "v1",
      params: {
        weatherApiKey: { type: "text/plain" },
      },
      start: "fetch",
      steps: {
        fetch: { type: "httpjson", url: "https://example.com" },
      },
    } satisfies FlowDefinition);

  const artifacts = {
    getJson: vi.fn().mockResolvedValue({ ok: true, value: flow }),
  } as unknown as ArtifactsPort;

  const artifactRepository = {
    listArtifacts: vi.fn().mockResolvedValue([]),
    associateArtifact:
      options?.associateArtifact ??
      vi.fn().mockImplementation(async (hash: string) => ({
        ok: true,
        value: { hash, time: new Date().toISOString(), curated: true },
      })),
    curateArtifactForParam: vi
      .fn()
      .mockResolvedValue({ ok: true, value: undefined }),
    uncurateArtifactForParam: vi
      .fn()
      .mockResolvedValue({ ok: true, value: undefined }),
    listCuratedArtifacts: vi.fn().mockResolvedValue([]),
  } as unknown as ArtifactRepositoryPort;

  const flowRepository = {
    getFlowVersion: vi.fn().mockResolvedValue({
      ok: true,
      value: {
        id: "version-1",
        flowId: "flow-1",
        sequence: 1,
        definitionHash: "flow-hash",
        createdAt: new Date().toISOString(),
      },
    }),
  } as unknown as FlowRepositoryPort;

  return {
    service: new ArtifactService(artifacts, artifactRepository, flowRepository),
    artifacts,
    artifactRepository,
    flowRepository,
  };
}

describe("ArtifactService.curateArtifactForParam", () => {
  it("rejects a param that isn't declared on the flow version's definition", async () => {
    const { service } = makeArtifactService();

    const result = await service.curateArtifactForParam(
      "artifact-hash",
      "version-1",
      "undeclaredParam",
    );

    expect(result.ok).toBe(false);
  });

  it("always sets flowVersionId, regardless of crossVersion", async () => {
    const { service, artifactRepository } = makeArtifactService();

    await service.curateArtifactForParam(
      "artifact-hash",
      "version-1",
      "weatherApiKey",
    );

    expect(artifactRepository.associateArtifact).toHaveBeenCalledWith(
      "artifact-hash",
      expect.objectContaining({ flowVersionId: "version-1", curated: true }),
    );
  });

  it("crossVersion: true additionally sets flowId from the version's flow", async () => {
    const { service, artifactRepository } = makeArtifactService();

    await service.curateArtifactForParam(
      "artifact-hash",
      "version-1",
      "weatherApiKey",
      true,
    );

    expect(artifactRepository.associateArtifact).toHaveBeenCalledWith(
      "artifact-hash",
      expect.objectContaining({
        flowVersionId: "version-1",
        flowId: "flow-1",
        curated: true,
      }),
    );
  });

  it("crossVersion: false/omitted never sends flowId: null (doesn't clear an existing flow-wide association)", async () => {
    const { service, artifactRepository } = makeArtifactService();

    await service.curateArtifactForParam(
      "artifact-hash",
      "version-1",
      "weatherApiKey",
      false,
    );

    const call = (
      artifactRepository.associateArtifact as ReturnType<typeof vi.fn>
    ).mock.calls[0][1];
    expect(call).not.toHaveProperty("flowId");
  });

  it("short-circuits before curateArtifactForParam when associateArtifact fails", async () => {
    const associateArtifact = vi
      .fn()
      .mockResolvedValue({ ok: false, error: "not found" });
    const { service, artifactRepository } = makeArtifactService({
      associateArtifact,
    });

    const result = await service.curateArtifactForParam(
      "artifact-hash",
      "version-1",
      "weatherApiKey",
    );

    expect(result.ok).toBe(false);
    expect(artifactRepository.curateArtifactForParam).not.toHaveBeenCalled();
  });
});

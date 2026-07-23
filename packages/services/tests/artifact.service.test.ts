import { describe, expect, it, vi } from "vitest";
import { ArtifactService } from "../src/artifact.service.js";
import type {
  ArtifactRepositoryPort,
  ArtifactsPort,
  FlowRepositoryPort,
} from "@lcase/ports";
import type { ArtifactIndex, FlowDefinition } from "@lcase/types";

function makeArtifactService(options?: {
  flow?: FlowDefinition;
  artifact?: ArtifactIndex;
  updateMetadata?: ReturnType<typeof vi.fn>;
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

  const artifact: ArtifactIndex = options?.artifact ?? {
    hash: "artifact-hash",
    time: new Date().toISOString(),
    format: "text",
    curated: false,
  };

  const artifacts = {
    getJson: vi.fn().mockResolvedValue({ ok: true, value: flow }),
  } as unknown as ArtifactsPort;

  const artifactRepository = {
    listArtifacts: vi.fn().mockResolvedValue([]),
    getArtifact: vi.fn().mockResolvedValue(artifact),
    updateMetadata:
      options?.updateMetadata ??
      vi.fn().mockImplementation(async (hash: string) => ({
        ok: true,
        value: { hash, time: new Date().toISOString(), curated: true },
      })),
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

describe("ArtifactService.updateArtifactMetadata", () => {
  it("skips flow-version validation entirely when paramCurations is absent", async () => {
    const { service, flowRepository, artifactRepository } =
      makeArtifactService();

    const result = await service.updateArtifactMetadata("artifact-hash", {
      label: "just a label",
    });

    expect(result.ok).toBe(true);
    expect(flowRepository.getFlowVersion).not.toHaveBeenCalled();
    expect(artifactRepository.updateMetadata).toHaveBeenCalledWith(
      "artifact-hash",
      { label: "just a label" },
    );
  });

  it("rejects a param that isn't declared on the flow version's definition", async () => {
    const { service, artifactRepository } = makeArtifactService();

    const result = await service.updateArtifactMetadata("artifact-hash", {
      flowVersionId: "version-1",
      paramCurations: ["undeclaredParam"],
    });

    expect(result.ok).toBe(false);
    expect(artifactRepository.updateMetadata).not.toHaveBeenCalled();
  });

  it("rejects a param whose declared type doesn't match the artifact's contentType/format", async () => {
    const { service, artifactRepository } = makeArtifactService({
      artifact: {
        hash: "artifact-hash",
        time: new Date().toISOString(),
        format: "json", // incompatible with the declared "text/plain" param
        curated: false,
      },
    });

    const result = await service.updateArtifactMetadata("artifact-hash", {
      flowVersionId: "version-1",
      paramCurations: ["weatherApiKey"],
    });

    expect(result.ok).toBe(false);
    expect(artifactRepository.updateMetadata).not.toHaveBeenCalled();
  });

  it("calls the repository once with the full metadata object when validation passes", async () => {
    const { service, artifactRepository } = makeArtifactService();

    const result = await service.updateArtifactMetadata("artifact-hash", {
      flowVersionId: "version-1",
      paramCurations: ["weatherApiKey"],
    });

    expect(result.ok).toBe(true);
    expect(artifactRepository.updateMetadata).toHaveBeenCalledWith(
      "artifact-hash",
      { flowVersionId: "version-1", paramCurations: ["weatherApiKey"] },
    );
  });

  it("never calls the repository when the flow version can't be found", async () => {
    const { service, artifactRepository, flowRepository } =
      makeArtifactService();
    (
      flowRepository.getFlowVersion as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      ok: false,
      error: "not found",
    });

    const result = await service.updateArtifactMetadata("artifact-hash", {
      flowVersionId: "version-1",
      paramCurations: ["weatherApiKey"],
    });

    expect(result.ok).toBe(false);
    expect(artifactRepository.updateMetadata).not.toHaveBeenCalled();
  });
});

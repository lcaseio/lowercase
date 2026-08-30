import { ArtifactRepositoryPort } from "@lcase/ports";
import { LegacyFsArtifactStore } from "@lcase/adapters/artifact-store";
import type { Registry } from "../types/registry.js";
import { Artifacts } from "@lcase/artifacts";

export const artifactRegistry = {
  embedded: {
    local: {
      fs: (path: string, repository?: ArtifactRepositoryPort) =>
        new Artifacts(new LegacyFsArtifactStore(path), repository),
    },
  },
} as const satisfies Registry;

export type ArtifactsRegistry = typeof artifactRegistry;
export type ArtifactsPlacement = keyof ArtifactsRegistry;
export type ArtifactsTransport = keyof ArtifactsRegistry[ArtifactsPlacement];
export type ArtifactsStore =
  keyof ArtifactsRegistry[ArtifactsPlacement][ArtifactsTransport];

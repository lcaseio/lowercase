import { ArtifactIndexStorePort } from "@lcase/ports";
import { FsArtifactStore } from "@lcase/adapters/artifact-store";
import type { Registry } from "../types/registry.js";
import { Artifacts } from "@lcase/artifacts";
import { FsArtifactIndexStore } from "@lcase/adapters/artifact-index-store";

export const artifactRegistry = {
  embedded: {
    local: {
      fs: (path: string, indexStore?: ArtifactIndexStorePort) =>
        new Artifacts(
          new FsArtifactStore(path),
          indexStore ?? new FsArtifactIndexStore(path),
        ),
    },
  },
} as const satisfies Registry;

export type ArtifactsRegistry = typeof artifactRegistry;
export type ArtifactsPlacement = keyof ArtifactsRegistry;
export type ArtifactsTransport = keyof ArtifactsRegistry[ArtifactsPlacement];
export type ArtifactsStore =
  keyof ArtifactsRegistry[ArtifactsPlacement][ArtifactsTransport];

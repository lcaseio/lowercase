import { ArtifactRepositoryPort, ArtifactsPort } from "@lcase/ports";
import { makeArtifactsFactory } from "../factories/registry.factory.js";
import { ArtifactsConfig } from "../types/runtime.config.js";

export function createArtifacts(
  config: ArtifactsConfig,
  repository?: ArtifactRepositoryPort,
): ArtifactsPort {
  const makeArtifacts = makeArtifactsFactory(
    config.placement,
    config.transport,
    config.store,
  );
  console.log(config.path);

  const artifacts = makeArtifacts(config.path, repository);
  return artifacts;
}

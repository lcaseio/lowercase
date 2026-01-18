import { ArtifactsPort } from "@lcase/ports";
import { makeArtifactsFactory } from "../factories/registry.factory.js";
import { ArtifactsConfig } from "../types/runtime.config.js";

export function createArtifacts(config: ArtifactsConfig): ArtifactsPort {
  const makeArtifacts = makeArtifactsFactory(
    config.placement,
    config.transport,
    config.store
  );

  const limiter = makeArtifacts(config.path);
  return limiter;
}

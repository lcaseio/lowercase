import type { ArtifactReaderPort } from "./artifact-reader.port.js";
import type { ArtifactWriterPort } from "./artifact-writer.port.js";

// Bundles the two capability-module halves (see docs/component-architecture/
// research/capability-modules.md) behind one dependency a component can
// hold, without blurring their distinct port dependencies -- reader needs
// only ArtifactStorePort, writer needs ArtifactStorePort +
// ArtifactRepositoryPort. Plain composition, no delegating implementation.
export type ArtifactAccessPort = {
  reader: ArtifactReaderPort;
  writer: ArtifactWriterPort;
};

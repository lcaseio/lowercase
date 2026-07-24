import type { ArtifactUpdateMetadata } from "./artifact-update-metadata.js";

// curated is explicit and deliberately decoupled from whether other fields
// are set -- a system write may someday set `label` without curating, so
// curation can't be derived from "is metadata present"
export type ArtifactWriteMetadata =
  | {
      curated: false;
      label?: string | null;
      flowId?: string | null;
      flowVersionId?: string | null;
    }
  | ({ curated: true } & ArtifactUpdateMetadata);

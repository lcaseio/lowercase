export type ArtifactIndex = {
  time: string; // iso datetime
  hash: string; // hash of artifact
  label?: string;
  id?: string; // id for indexing later in sql
  filename?: string; // original filename
  contentType?: string;
  size?: number;
  format?: "json" | "text" | "markdown" | "bytes";
  flowId?: string;
  flowVersionId?: string;
  curated?: boolean;
};

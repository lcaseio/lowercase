import type { ArtifactFormat } from "./artifact-put.js";

export type ArtifactWriteContent = {
  hash: string;
  time?: string;
  size?: number;
  contentType?: string;
  format?: ArtifactFormat;
  filename?: string;
};

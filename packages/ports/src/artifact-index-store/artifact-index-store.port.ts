import type { ArtifactIndex, Result } from "@lcase/types";

export interface ArtifactIndexStorePort {
  init(): Promise<void>;
  put(index: ArtifactIndex): Promise<Result<ArtifactIndex, string>>;
  get(hash: string): Promise<ArtifactIndex | undefined>;
  getIndexList(): Promise<string[]>;
  getAll(): Promise<ArtifactIndex[]>;
}

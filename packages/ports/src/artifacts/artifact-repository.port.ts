import type { ArtifactIndex, Result } from "@lcase/types";

export interface ArtifactRepositoryPort {
  saveArtifact(index: ArtifactIndex): Promise<Result<ArtifactIndex, string>>;
  getArtifact(hash: string): Promise<ArtifactIndex | undefined>;
  getArtifacts(hashes: string[]): Promise<ArtifactIndex[]>;
  listArtifactHashes(): Promise<string[]>;
  listArtifacts(): Promise<ArtifactIndex[]>;
}

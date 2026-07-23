import type {
  ArtifactIndex,
  ArtifactListFilter,
  ArtifactListItem,
  ArtifactMetadata,
  Result,
} from "@lcase/types";

export interface ArtifactRepositoryPort {
  saveArtifact(index: ArtifactIndex): Promise<Result<ArtifactIndex, string>>;
  getArtifact(hash: string): Promise<ArtifactIndex | undefined>;
  getArtifacts(hashes: string[]): Promise<ArtifactIndex[]>;
  listArtifactHashes(): Promise<string[]>;
  listArtifacts(filter?: ArtifactListFilter): Promise<ArtifactListItem[]>;
  // the only way flowId/flowVersionId/curated ever get set -- deliberate
  // curation, never the worker's content-put path (see ArtifactIndexInput)
  updateMetadata(
    hash: string,
    metadata: ArtifactMetadata,
  ): Promise<Result<ArtifactIndex, string>>;
  listCuratedArtifacts(
    flowVersionId: string,
    paramName: string,
  ): Promise<ArtifactIndex[]>;
}

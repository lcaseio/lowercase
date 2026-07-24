import type {
  ArtifactIndex,
  ArtifactListFilter,
  ArtifactListItem,
  ArtifactUpdateMetadata,
  ArtifactWriteContent,
  ArtifactWriteMetadata,
  Result,
} from "@lcase/types";

export interface ArtifactRepositoryPort {
  // insert/upsert path -- content-put (worker/system, metadata omitted) and
  // a future user-creation flow (real ArtifactWriteMetadata) both funnel
  // through here
  writeArtifact(
    content: ArtifactWriteContent,
    metadata?: ArtifactWriteMetadata,
  ): Promise<Result<ArtifactIndex, string>>;
  getArtifact(hash: string): Promise<ArtifactIndex | undefined>;
  getArtifacts(hashes: string[]): Promise<ArtifactIndex[]>;
  listArtifactHashes(): Promise<string[]>;
  listArtifacts(filter?: ArtifactListFilter): Promise<ArtifactListItem[]>;
  // update path -- this artifact definitely already exists, only metadata
  // is being touched; errors on a missing hash rather than fabricating one
  updateMetadata(
    hash: string,
    metadata: ArtifactUpdateMetadata,
  ): Promise<Result<ArtifactIndex, string>>;
  listCuratedArtifacts(
    flowVersionId: string,
    paramName: string,
  ): Promise<ArtifactIndex[]>;
}

import type {
  ArtifactAssociation,
  ArtifactIndex,
  ArtifactParamCurationRecord,
  Result,
} from "@lcase/types";

export interface ArtifactRepositoryPort {
  saveArtifact(index: ArtifactIndex): Promise<Result<ArtifactIndex, string>>;
  getArtifact(hash: string): Promise<ArtifactIndex | undefined>;
  getArtifacts(hashes: string[]): Promise<ArtifactIndex[]>;
  listArtifactHashes(): Promise<string[]>;
  listArtifacts(): Promise<ArtifactIndex[]>;
  // the only way flowId/flowVersionId ever get set -- deliberate curation,
  // never the worker's content-put path (see ArtifactIndexInput)
  associateArtifact(
    hash: string,
    association: ArtifactAssociation,
  ): Promise<Result<ArtifactIndex, string>>;
  curateArtifactForParam(
    entry: ArtifactParamCurationRecord,
  ): Promise<Result<void, string>>;
  uncurateArtifactForParam(
    entry: ArtifactParamCurationRecord,
  ): Promise<Result<void, string>>;
  listCuratedArtifacts(
    flowVersionId: string,
    paramName: string,
  ): Promise<ArtifactIndex[]>;
}

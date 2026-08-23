export type ArtifactListFilter = {
  flowId?: string;
  flowVersionId?: string;
  curated?: boolean;
  // Finds this exact artifact by identity, regardless of its own
  // flowId/flowVersionId/curated columns -- a worker-produced artifact
  // (a step's run output/export) never gets any of those set, so a
  // flowVersionId-scoped filter alone can never find it. When present, this
  // takes over row-selection entirely (flowId/curated are ignored for that
  // purpose); flowVersionId, if also given, still scopes which
  // paramCurations get included -- see PrismaArtifactRepository.listArtifacts.
  hash?: string;
};

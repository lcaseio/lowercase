// undefined/omitted means "leave unchanged"; null means "explicitly clear"
// (curated has no "clear" state -- it's just true or false)
export type ArtifactAssociation = {
  flowId?: string | null;
  flowVersionId?: string | null;
  curated?: boolean;
};

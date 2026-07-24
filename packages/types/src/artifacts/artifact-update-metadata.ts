// undefined/omitted means "leave unchanged"; null means "explicitly clear"
// (curated has no field here -- the repository sets it unconditionally on
// every write, it's never a caller concern)
// the union enforces flowVersionId to be present if paramsCurations are defined
export type ArtifactUpdateMetadata =
  | {
      label?: string | null;
      flowId?: string | null;
      flowVersionId?: string | null;
      paramCurations?: undefined;
    }
  | {
      label?: string | null;
      flowId?: string | null;
      flowVersionId: string;
      paramCurations?: string[];
    };

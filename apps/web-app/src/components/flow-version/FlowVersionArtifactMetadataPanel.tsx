import { useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import type { ArtifactMetadata, FlowParamDefinition } from "@lcase/types";
import { isArtifactCompatible } from "@lcase/flow-analysis";
import {
  artifactsApi,
  useListArtifactsQuery,
  useUpdateArtifactMetadataMutation,
} from "@/redux/api/artifacts-api";
import { useAppDispatch, useAppSelector } from "@/redux/typed-hooks";
import {
  artifactMetadataSaved,
  cancelEditingArtifactMetadata,
  selectFlowVersionArtifactsState,
  setDraftShare,
  startEditingArtifactMetadata,
  toggleDraftParam,
  updateDraftLabel,
} from "@/redux/slices/flow-version-artifacts-slice";
import { Button } from "../ui/button";
import { IdentityField } from "../fields/IdentityField";
import { InputField } from "../fields/InputField";
import { SwitchField } from "../fields/SwitchField";
import { CuratedParamsField } from "../fields/CuratedParamsField";

type Props = {
  flowId: string | null;
  flowVersionId: string | null;
  selectedHash: string | null;
  params?: Record<string, FlowParamDefinition>;
};

// right panel of Artifacts mode -- metadata/associations for whatever's
// selected in the list. Reuses the list's own (cached) query rather than a
// second endpoint, since useListArtifactsQuery is already scoped+fetched there
// with identical args -- this is a cache hit, not a new network request.
// Read-only by default; an explicit Edit button seeds a draft (owned by
// flow-version-artifacts-slice, so it survives navigating to another mode
// and back) and swaps the bottom action row to Save/Cancel.
export function FlowVersionArtifactMetadataPanel({
  flowId,
  flowVersionId,
  selectedHash,
  params,
}: Props) {
  const dispatch = useAppDispatch();
  const { draft, isEditing } = useAppSelector((s) =>
    selectFlowVersionArtifactsState(s, flowVersionId),
  );
  const [updateMetadata, { isLoading: isSaving }] =
    useUpdateArtifactMetadataMutation();
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data, isLoading } = useListArtifactsQuery(
    flowVersionId ? { flowVersionId, curated: "true" } : skipToken,
  );

  if (!selectedHash) {
    return <div className="p-4">Select an artifact to view its metadata</div>;
  }
  if (isLoading) {
    return <div className="p-4">Loading artifact metadata...</div>;
  }
  if (!data) {
    return <div className="p-4">No artifact data</div>;
  }
  if (!data.ok) {
    return <div className="p-4">Error loading artifacts: {data.error}</div>;
  }

  const item = data.value.find((i) => i.artifact.hash === selectedHash);
  if (!item) {
    return <div className="p-4">Artifact metadata not found</div>;
  }

  const { artifact, associations } = item;
  const savedCuratedParamNames = associations.paramCurations.map(
    (pc) => pc.paramName,
  );
  /**
   * only offer params whose declared content type actually matches this
   * artifact -- same check run.service.ts uses to validate a run's param
   * artifacts; the server enforces this too, so this is UX, not the only guard
   */
  const compatibleParams = params
    ? Object.fromEntries(
        Object.entries(params).filter(([, def]) =>
          isArtifactCompatible(artifact, def.type),
        ),
      )
    : undefined;

  function handleEdit() {
    setSaveError(null);
    dispatch(
      startEditingArtifactMetadata({
        label: artifact.label ?? "",
        share: !!associations.flowId,
        curatedParamNames: savedCuratedParamNames,
      }),
    );
  }

  function handleCancel() {
    setSaveError(null);
    dispatch(cancelEditingArtifactMetadata());
  }

  async function handleSave() {
    if (!draft || !flowVersionId || !selectedHash) return;
    setSaveError(null);
    const metadata: ArtifactMetadata = {
      label: draft.label.trim() ? draft.label.trim() : null,
      flowId: draft.share ? flowId : null,
      flowVersionId,
      paramCurations: draft.curatedParamNames,
    };
    try {
      const result = await updateMetadata({
        hash: selectedHash,
        metadata,
      }).unwrap();
      if (result.ok) {
        /**
         * patches the cached artifact list with this PATCH response, so other
         * consumers of that same cache (namely the left artifact list) show
         * the new label/associations right away instead of lagging until the
         * invalidatesTags refetch below completes.
         *
         * this panel's own fields don't need this: they read from `draft`
         * (state), which stays populated until Cancel or a different
         * artifact is selected.
         */
        dispatch(
          artifactsApi.util.updateQueryData(
            "listArtifacts",
            { flowVersionId, curated: "true" },
            (list) => {
              if (!list.ok) return;
              const cachedItem = list.value.find(
                (i) => i.artifact.hash === selectedHash,
              );
              if (!cachedItem) return;
              cachedItem.artifact = result.value;
              cachedItem.associations = {
                flowId: metadata.flowId ?? undefined,
                flowVersionId,
                curated: true,
                paramCurations: draft.curatedParamNames.map((paramName) => ({
                  flowVersionId,
                  paramName,
                })),
              };
            },
          ),
        );
        dispatch(artifactMetadataSaved());
      } else {
        setSaveError(result.error);
      }
    } catch {
      setSaveError("Failed to save artifact metadata. Please try again.");
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto">
        <IdentityField label="Hash" value={artifact.hash} />
        <IdentityField
          label="Time"
          value={new Date(artifact.time).toLocaleString()}
        />
        <IdentityField label="Content Type" value={artifact.contentType} />
        <IdentityField
          label="Size"
          value={
            artifact.size !== undefined ? `${artifact.size} bytes` : undefined
          }
        />
        <IdentityField label="Format" value={artifact.format} />

        <InputField
          label="Label"
          value={draft ? draft.label : artifact.label}
          onChange={
            isEditing ? (v) => dispatch(updateDraftLabel(v)) : undefined
          }
        />
        <SwitchField
          label="Share"
          value={draft ? draft.share : !!associations.flowId}
          onChange={
            isEditing
              ? (checked) => dispatch(setDraftShare(checked))
              : undefined
          }
        />
        <CuratedParamsField
          label="Params"
          params={compatibleParams}
          curatedParamNames={
            draft ? draft.curatedParamNames : savedCuratedParamNames
          }
          onToggleParam={
            isEditing
              ? (paramName, checked) =>
                  dispatch(toggleDraftParam({ paramName, checked }))
              : undefined
          }
        />
      </div>
      <div className="flex items-center justify-end gap-2  p-4">
        {saveError && (
          <p className="text-xs text-destructive mr-auto">{saveError}</p>
        )}
        {isEditing ? (
          <>
            <Button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="cursor-pointer text-neutral-900 bg-rose-300 hover:bg-rose-200 dark:bg-rose-800 dark:hover:bg-rose-600 dark:text-neutral-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="cursor-pointer text-neutral-900 bg-emerald-300 hover:bg-emerald-200 dark:bg-emerald-800 dark:hover:bg-emerald-600 dark:text-neutral-50"
            >
              Save
            </Button>
          </>
        ) : (
          <Button
            type="button"
            onClick={handleEdit}
            className="cursor-pointer  text-neutral-900  bg-sky-300 hover:bg-sky-200 dark:bg-sky-800 dark:hover:bg-sky-600  dark:text-neutral-50"
          >
            Edit
          </Button>
        )}
      </div>
    </div>
  );
}

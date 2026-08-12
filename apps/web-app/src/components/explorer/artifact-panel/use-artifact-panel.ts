import { useState } from "react";
import type { ArtifactUpdateMetadata } from "@lcase/types";
import { isArtifactCompatible } from "@lcase/flow-analysis";
import { useGetFlowVersionDefQuery } from "@/redux/api/flows-api";
import {
  artifactsApi,
  useListArtifactsQuery,
  useUpdateArtifactMetadataMutation,
} from "@/redux/api/artifacts-api";
import { useAppDispatch, useAppSelector } from "@/redux/typed-hooks";
import { useDelayedLoading } from "@/hooks/use-delayed-loading";
import {
  artifactMetadataSaved,
  cancelEditingArtifactMetadata,
  selectArtifactPanelState,
  setDraftShare,
  sidePanelTabSet,
  startEditingArtifactMetadata,
  toggleDraftParam,
  updateDraftLabel,
  type ArtifactSidePanelTab,
} from "@/redux/slices/artifact-panels-slice";

// All the data-fetching, Redux read/write, and derived state the artifact
// panel needs -- Content.tsx composes JSX from this, mirroring
// use-flow-graph-panel.ts's split. versionId is the metadata query's scope
// (see explorer-panels.ts's artifact variant), not this panel's identity.
export function useArtifactPanel(
  hash: string,
  versionId: string,
  panelId: string,
) {
  const dispatch = useAppDispatch();
  const { sidePanelTab, draft, isEditing } = useAppSelector((state) =>
    selectArtifactPanelState(state, panelId),
  );
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    data: versionData,
    isLoading: isVersionLoading,
    error: versionError,
    refetch,
  } = useGetFlowVersionDefQuery(versionId);
  const flowDef = versionData?.ok ? versionData.value.definition : null;
  const version = versionData?.ok ? versionData.value.version : null;

  const { data: artifactsData, isLoading: isArtifactsLoading } =
    useListArtifactsQuery({ flowVersionId: versionId, curated: "true" });

  const [updateMetadata, { isLoading: isSaving }] =
    useUpdateArtifactMetadataMutation();

  const showLoading = useDelayedLoading(isVersionLoading || isArtifactsLoading);
  const hasError =
    !!versionError ||
    (versionData !== undefined && !versionData.ok) ||
    (artifactsData !== undefined && !artifactsData.ok);

  const item = artifactsData?.ok
    ? artifactsData.value.find((i) => i.artifact.hash === hash)
    : undefined;

  const savedCuratedParamNames =
    item?.associations.paramCurations.map((pc) => pc.paramName) ?? [];

  /**
   * only offer params whose declared content type actually matches this
   * artifact -- same check run.service.ts uses to validate a run's param
   * artifacts; the server enforces this too, so this is UX, not the only guard
   */
  const compatibleParams =
    flowDef && item
      ? Object.fromEntries(
          Object.entries(flowDef.params ?? {}).filter(([, def]) =>
            isArtifactCompatible(item.artifact, def.type),
          ),
        )
      : undefined;

  const handleSelectSidePanelTab = (tab: ArtifactSidePanelTab | null) => {
    dispatch(sidePanelTabSet({ panelId, tab }));
  };

  function handleEdit() {
    if (!item) return;
    setSaveError(null);
    dispatch(
      startEditingArtifactMetadata({
        panelId,
        draft: {
          label: item.artifact.label ?? "",
          share: !!item.associations.flowId,
          curatedParamNames: savedCuratedParamNames,
        },
      }),
    );
  }

  function handleCancel() {
    setSaveError(null);
    dispatch(cancelEditingArtifactMetadata({ panelId }));
  }

  async function handleSave() {
    if (!draft || !version) return;
    setSaveError(null);
    const metadata: ArtifactUpdateMetadata = {
      label: draft.label.trim() ? draft.label.trim() : null,
      flowId: draft.share ? version.flowId : null,
      flowVersionId: versionId,
      paramCurations: draft.curatedParamNames,
    };
    try {
      const result = await updateMetadata({ hash, metadata }).unwrap();
      if (result.ok) {
        // patches the cached artifact list with this PATCH response, so
        // other consumers of that same cache (the tree's own artifact list)
        // show the new label/associations right away instead of lagging
        // until the invalidatesTags refetch below completes.
        dispatch(
          artifactsApi.util.updateQueryData(
            "listArtifacts",
            { flowVersionId: versionId, curated: "true" },
            (list) => {
              if (!list.ok) return;
              const cachedItem = list.value.find(
                (i) => i.artifact.hash === hash,
              );
              if (!cachedItem) return;
              cachedItem.artifact = result.value;
              cachedItem.associations = {
                flowId: metadata.flowId ?? undefined,
                flowVersionId: versionId,
                curated: true,
                paramCurations: draft.curatedParamNames.map((paramName) => ({
                  flowVersionId: versionId,
                  paramName,
                })),
              };
            },
          ),
        );
        dispatch(artifactMetadataSaved({ panelId }));
      } else {
        setSaveError(result.error);
      }
    } catch {
      setSaveError("Failed to save artifact metadata. Please try again.");
    }
  }

  function handleLabelChange(label: string) {
    dispatch(updateDraftLabel({ panelId, label }));
  }
  function handleShareChange(share: boolean) {
    dispatch(setDraftShare({ panelId, share }));
  }
  function handleToggleParam(paramName: string, checked: boolean) {
    dispatch(toggleDraftParam({ panelId, paramName, checked }));
  }

  return {
    showLoading,
    hasError,
    refetch,
    item,
    compatibleParams,
    savedCuratedParamNames,
    sidePanelTab,
    draft,
    isEditing,
    isSaving,
    saveError,
    handleSelectSidePanelTab,
    handleEdit,
    handleCancel,
    handleSave,
    handleLabelChange,
    handleShareChange,
    handleToggleParam,
  };
}

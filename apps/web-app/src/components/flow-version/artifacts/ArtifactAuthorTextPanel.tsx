import { useState } from "react";
import type { ArtifactUpdateMetadata } from "@lcase/types";
import {
  artifactsApi,
  useCreateArtifactMutation,
} from "@/redux/api/artifacts-api";
import { useAppDispatch, useAppSelector } from "@/redux/typed-hooks";
import {
  artifactAuthored,
  cancelAuthoringArtifact,
  selectArtifact,
  selectFlowVersionArtifactsState,
  setAuthoringContent,
} from "@/redux/slices/flow-version-artifacts-slice";

import { Button } from "../../ui/button";
import { CheckIcon, XIcon } from "lucide-react";
import { CodeEditor } from "@/components/CodeEditor";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { detectAuthoredFormat } from "@/lib/detect-authored-format";
import { artifactFormatToLanguage } from "@/lib/ref-resolution";

type Props = {
  flowId: string | null;
  flowVersionId: string | null;
};

// middle panel while authoring -- file picker + its own Save/Cancel row,
// deliberately not in the right panel (which just composes metadata) to
// avoid colliding with the metadata-edit panel's own Save/Cancel in the
// same visual slot
export function ArtifactAuthorTextPanel({ flowId, flowVersionId }: Props) {
  const dispatch = useAppDispatch();
  const { authoringDraft } = useAppSelector((s) =>
    selectFlowVersionArtifactsState(s, flowVersionId),
  );
  const [createArtifact, { isLoading: isSaving }] = useCreateArtifactMutation();

  const debouncedSetContent = useDebouncedCallback((value: string) => {
    dispatch(setAuthoringContent(value));
  }, 250);

  const [saveError, setSaveError] = useState<string | null>(null);

  if (!authoringDraft || authoringDraft.kind !== "text") return null;
  // narrowing above doesn't survive into the nested closures below (TS
  // can't assume a closure captures a snapshot) -- alias to a stable local
  const draft = authoringDraft;

  function handleCancel() {
    dispatch(cancelAuthoringArtifact());
  }

  async function handleSave() {
    if (!flowVersionId) return;
    if (authoringDraft?.kind !== "text") return;
    if (authoringDraft.content.trim().length === 0) {
      setSaveError("Error saving: content must contain more than whitespace.");
      return;
    }

    // fast local feedback only -- value is always sent as the raw string
    // regardless (the server parses it when contentType implies json,
    // matching the multipart branch's own contract), so this doesn't change
    // what's sent, just catches an obvious typo before round-tripping
    if (draft.contentType === "application/json") {
      try {
        JSON.parse(draft.content);
      } catch {
        setSaveError("Error saving: content is not valid JSON.");
        return;
      }
    }

    setSaveError(null);
    const metadata: ArtifactUpdateMetadata = {
      label: draft.label.trim() ? draft.label.trim() : null,
      flowId: draft.share ? flowId : null,
      flowVersionId,
      paramCurations: draft.curatedParamNames,
    };
    try {
      const result = await createArtifact({
        kind: "authored",
        contentType: draft.contentType,
        value: draft.content,
        metadata,
      }).unwrap();
      if (result.ok) {
        // patches the cached artifact list with this response, mirroring
        // ArtifactMetadataPanel.handleSave -- lets selectArtifact
        // below show the new item immediately instead of waiting on
        // invalidatesTags' refetch to land
        dispatch(
          artifactsApi.util.updateQueryData(
            "listArtifacts",
            { flowVersionId, curated: "true" },
            (list) => {
              if (!list.ok) return;
              list.value.push({
                artifact: result.value,
                associations: {
                  flowId: metadata.flowId ?? undefined,
                  flowVersionId,
                  curated: true,
                  paramCurations: draft.curatedParamNames.map((paramName) => ({
                    flowVersionId,
                    paramName,
                  })),
                },
              });
            },
          ),
        );
        dispatch(artifactAuthored());
        dispatch(selectArtifact(result.value.hash));
      } else {
        setSaveError(result.error);
      }
    } catch {
      setSaveError("Failed to create artifact. Please try again.");
    }
  }

  return (
    <div className="flex flex-col h-full gap-4 dark:bg-neutral-850">
      <div className="flex-1 flex flex-col gap-4  min-h-0">
        <h3 className="font-medium shrink-0 mt-3 ml-3">New Text Artifact</h3>
        <div className="flex-1 min-h-0">
          <CodeEditor
            height="100%"
            value={draft.content}
            language={artifactFormatToLanguage(
              detectAuthoredFormat(draft.contentType),
            )}
            onChange={debouncedSetContent}
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pb-4 pr-4 shrink-0">
        {saveError && (
          <p className="text-xs text-destructive mr-auto">{saveError}</p>
        )}
        <Button
          type="button"
          onClick={handleCancel}
          disabled={isSaving}
          className="cursor-pointer text-neutral-900 bg-rose-300 hover:bg-rose-200 dark:bg-rose-800 dark:hover:bg-rose-600 dark:text-neutral-50"
        >
          <XIcon />
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="cursor-pointer text-neutral-900 bg-emerald-300 hover:bg-emerald-200 dark:bg-emerald-800 dark:hover:bg-emerald-600 dark:text-neutral-50"
        >
          <CheckIcon />
          Save
        </Button>
      </div>
    </div>
  );
}

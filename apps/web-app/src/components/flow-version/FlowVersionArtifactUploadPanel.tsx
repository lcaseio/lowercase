import { useLayoutEffect, useRef, useState } from "react";
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
  setAuthoringFile,
} from "@/redux/slices/flow-version-artifacts-slice";
import { detectFileFormat } from "@/lib/detect-file-format";
import { Button } from "../ui/button";

type Props = {
  flowId: string | null;
  flowVersionId: string | null;
};

// middle panel while authoring -- file picker + its own Save/Cancel row,
// deliberately not in the right panel (which just composes metadata) to
// avoid colliding with the metadata-edit panel's own Save/Cancel in the
// same visual slot
export function FlowVersionArtifactUploadPanel({
  flowId,
  flowVersionId,
}: Props) {
  const dispatch = useAppDispatch();
  const { authoringDraft } = useAppSelector((s) =>
    selectFlowVersionArtifactsState(s, flowVersionId),
  );
  const [createArtifact, { isLoading: isSaving }] = useCreateArtifactMutation();
  // the live File object lives here, not Redux -- not serializable, and
  // doesn't need to survive a mode-switch (this component unmounts then)
  const [file, setFile] = useState<File | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // the picked File never survives a mount (local state above always
  // starts null) -- if Redux still remembers a file breadcrumb from
  // before navigating away, clear it before paint so the right panel
  // never shows a stale filename/format/size next to an empty picker.
  // useLayoutEffect (not useEffect) so this runs before the browser
  // paints, not after -- otherwise the stale breadcrumb would flash
  // onscreen for a frame before being corrected. Empty deps deliberately:
  // this should only reconcile the mount-time value once, never re-fire
  // just because authoringDraft changes later (e.g. from picking a file)
  useLayoutEffect(() => {
    if (authoringDraft?.file) {
      dispatch(setAuthoringFile(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!authoringDraft) return null;
  // narrowing above doesn't survive into the nested closures below (TS
  // can't assume a closure captures a snapshot) -- alias to a stable local
  const draft = authoringDraft;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSaveError(null);
    const picked = e.target.files?.[0] ?? null;
    if (!picked) {
      setFile(null);
      setPickError(null);
      dispatch(setAuthoringFile(null));
      return;
    }

    const format = detectFileFormat(picked);
    if (format === "bytes") {
      setFile(null);
      setPickError(
        "Unsupported file type -- only JSON, text, and Markdown files are supported right now.",
      );
      dispatch(setAuthoringFile(null));
      e.target.value = "";
      return;
    }

    setPickError(null);
    setFile(picked);
    dispatch(
      setAuthoringFile({
        name: picked.name,
        size: picked.size,
        contentType: picked.type,
        format,
      }),
    );
  }

  function handleCancel() {
    dispatch(cancelAuthoringArtifact());
  }

  async function handleSave() {
    if (!file || !flowVersionId) return;
    setSaveError(null);
    const metadata: ArtifactUpdateMetadata = {
      label: draft.label.trim() ? draft.label.trim() : null,
      flowId: draft.share ? flowId : null,
      flowVersionId,
      paramCurations: draft.curatedParamNames,
    };
    try {
      const result = await createArtifact({
        kind: "file",
        file,
        metadata,
      }).unwrap();
      if (result.ok) {
        // patches the cached artifact list with this response, mirroring
        // FlowVersionArtifactMetadataPanel.handleSave -- lets selectArtifact
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
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col gap-4 p-4">
        <h3 className="font-medium">Add File</h3>
        {/* native file input hidden -- styled uniformly with other text
        inputs, it loses the button-vs-status-text contrast that normally
        signals "click to browse" vs "this is just a readout". A custom
        button + plain status text below restores that distinction */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.txt,.md,application/json,text/plain,text/markdown"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer"
          >
            Browse...
          </Button>
          <p className="text-sm text-muted-foreground">
            {file ? file.name : "No file selected"}
          </p>
        </div>
        {pickError && <p className="text-xs text-destructive">{pickError}</p>}
      </div>
      <div className="flex items-center justify-end gap-2 p-4">
        {saveError && (
          <p className="text-xs text-destructive mr-auto">{saveError}</p>
        )}
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
          disabled={!file || isSaving}
          className="cursor-pointer text-neutral-900 bg-emerald-300 hover:bg-emerald-200 dark:bg-emerald-800 dark:hover:bg-emerald-600 dark:text-neutral-50"
        >
          Save
        </Button>
      </div>
    </div>
  );
}

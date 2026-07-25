import { useEffect, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useAppDispatch, useAppSelector } from "@/redux/typed-hooks";
import {
  enterFlowVersionArtifactsScope,
  selectArtifact,
  selectFlowVersionArtifactsState,
  startAuthoringArtifact,
  type ArtifactAuthoringDraft,
} from "@/redux/slices/flow-version-artifacts-slice";
import { ArtifactList } from "@/components/flow-version/artifacts/ArtifactList";
import { ArtifactContentPanel } from "@/components/flow-version/artifacts/ArtifactContentPanel";
import { ArtifactMetadataPanel } from "@/components/flow-version/artifacts/ArtifactMetadataPanel";
import { ArtifactUploadPanel } from "@/components/flow-version/artifacts/ArtifactUploadPanel";
import { ArtifactAuthoringMetadataPanel } from "@/components/flow-version/artifacts/ArtifactAuthoringMetadataPanel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFlowVersionOutletContext } from "./context";
import { ArtifactAuthorTextPanel } from "@/components/flow-version/artifacts/ArtifactAuthorTextPanel";

// artifacts mode page for the flow workspace version -- browse this flow
// version's curated artifacts on the left, view content in the middle, and
// full metadata/associations on the right (editable, PR 5). "Add File"
// (PR 6c) swaps the middle/right panels into an authoring flow in place --
// no modal, no tabs, driven by flowVersionArtifactsState.mode.
export function FlowVersionArtifacts() {
  const { flowId, flowVersionId, flowDef } = useFlowVersionOutletContext();
  const dispatch = useAppDispatch();
  const [showGuardModal, setShowGuardModal] = useState<boolean>(false);

  useEffect(() => {
    if (flowVersionId && flowId) {
      dispatch(enterFlowVersionArtifactsScope({ flowVersionId, flowId }));
    }
  }, [dispatch, flowVersionId, flowId]);

  const artifactsState = useAppSelector((s) =>
    selectFlowVersionArtifactsState(s, flowVersionId),
  );

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-full border dark:border-neutral-800"
    >
      <ResizablePanel defaultSize="25%" className="dark:bg-neutral-875">
        <ArtifactList
          flowVersionId={flowVersionId}
          // while authoring, the middle/right panels no longer show the
          // previously-selected artifact -- selectedArtifactHash itself is
          // deliberately untouched (still there for when authoring ends),
          // this only affects whether the list visually rings it
          selectedHash={
            artifactsState.mode === "authoring"
              ? null
              : artifactsState.selectedArtifactHash
          }
          onSelectArtifact={(hash) => {
            // re-clicking the artifact you're already viewing isn't a
            // navigation -- nothing to guard
            if (hash === artifactsState.selectedArtifactHash) return;
            if (
              artifactsState.isEditing ||
              artifactsState.mode === "authoring"
            ) {
              setShowGuardModal(true);
              return;
            }
            dispatch(selectArtifact(hash));
          }}
          onAuthorArtifact={(kind: ArtifactAuthoringDraft["kind"]) =>
            dispatch(startAuthoringArtifact(kind))
          }
          addArtifactDisabled={
            artifactsState.isEditing || artifactsState.mode === "authoring"
          }
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="45%" style={{ overflow: "hidden" }}>
        {artifactsState.mode === "authoring" ? (
          artifactsState.authoringDraft?.kind === "file" ? (
            <ArtifactUploadPanel
              flowId={flowId}
              flowVersionId={flowVersionId}
            />
          ) : artifactsState.authoringDraft?.kind === "text" ? (
            <ArtifactAuthorTextPanel
              flowId={flowId}
              flowVersionId={flowVersionId}
            />
          ) : null
        ) : (
          <ArtifactContentPanel hash={artifactsState.selectedArtifactHash} />
        )}
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="30%" className="dark:bg-neutral-800">
        {artifactsState.mode === "authoring" ? (
          <ArtifactAuthoringMetadataPanel
            flowVersionId={flowVersionId}
            params={flowDef?.params}
          />
        ) : (
          <ArtifactMetadataPanel
            flowId={flowId}
            flowVersionId={flowVersionId}
            selectedHash={artifactsState.selectedArtifactHash}
            params={flowDef?.params}
          />
        )}
      </ResizablePanel>
      <Dialog open={showGuardModal} onOpenChange={setShowGuardModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved changes</DialogTitle>
            <DialogDescription>
              Save or discard your changes before viewing another artifact.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={() => setShowGuardModal(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ResizablePanelGroup>
  );
}

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
} from "@/redux/slices/flow-version-artifacts-slice";
import { FlowVersionArtifactsList } from "@/components/flow-version/FlowVersionArtifactsList";
import { FlowVersionArtifactContentPanel } from "@/components/flow-version/FlowVersionArtifactContentPanel";
import { FlowVersionArtifactMetadataPanel } from "@/components/flow-version/FlowVersionArtifactMetadataPanel";
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

// artifacts mode page for the flow workspace version -- browse this flow
// version's curated artifacts on the left, view content in the middle, and
// full metadata/associations on the right (editable, PR 5). No creation flow
// yet (a later PR).
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
        <FlowVersionArtifactsList
          flowVersionId={flowVersionId}
          selectedHash={artifactsState.selectedArtifactHash}
          onSelectArtifact={(hash) => {
            // re-clicking the artifact you're already viewing isn't a
            // navigation -- nothing to guard
            if (hash === artifactsState.selectedArtifactHash) return;
            if (artifactsState.isEditing) {
              setShowGuardModal(true);
              return;
            }
            dispatch(selectArtifact(hash));
          }}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="45%" style={{ overflow: "hidden" }}>
        <FlowVersionArtifactContentPanel
          hash={artifactsState.selectedArtifactHash}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="30%" className="dark:bg-neutral-800">
        <FlowVersionArtifactMetadataPanel
          flowId={flowId}
          flowVersionId={flowVersionId}
          selectedHash={artifactsState.selectedArtifactHash}
          params={flowDef?.params}
        />
      </ResizablePanel>
      <Dialog open={showGuardModal} onOpenChange={setShowGuardModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved changes</DialogTitle>
            <DialogDescription>
              Save or discard metadata changes before viewing another artifact.
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

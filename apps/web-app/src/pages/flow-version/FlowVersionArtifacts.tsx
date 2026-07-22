import { useEffect } from "react";
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
import { useFlowVersionOutletContext } from "./context";

// artifacts mode page for the flow workspace version -- browse this flow
// version's curated artifacts on the left, view content in the middle, and
// full metadata/associations (read-only) on the right. No edit/creation flow
// yet (later PRs)
export function FlowVersionArtifacts() {
  const { flowId, flowVersionId, flowDef } = useFlowVersionOutletContext();
  const dispatch = useAppDispatch();

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
          onSelectArtifact={(hash) => dispatch(selectArtifact(hash))}
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
          flowVersionId={flowVersionId}
          selectedHash={artifactsState.selectedArtifactHash}
          params={flowDef?.params}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

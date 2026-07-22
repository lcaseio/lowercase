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
import { useFlowVersionOutletContext } from "./context";

// artifacts mode page for the flow workspace version -- browse this flow
// version's curated artifacts on the left, view content in the middle.
// No metadata/edit panel yet (a later PR); no creation flow yet (later still)
export function FlowVersionArtifacts() {
  const { flowId, flowVersionId } = useFlowVersionOutletContext();
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
      <ResizablePanel defaultSize="30%" className="dark:bg-neutral-875">
        <FlowVersionArtifactsList
          flowVersionId={flowVersionId}
          selectedHash={artifactsState.selectedArtifactHash}
          onSelectArtifact={(hash) => dispatch(selectArtifact(hash))}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="70%" style={{ overflow: "hidden" }}>
        <FlowVersionArtifactContentPanel
          hash={artifactsState.selectedArtifactHash}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

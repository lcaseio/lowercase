import type { ForkSpecListItem } from "@lcase/types";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "../ui/item";
import { Button } from "../ui/button";

import { useAppDispatch } from "@/redux/typed-hooks";

import {
  setReusedStepIds,
  setSimsFlowHash,
  setSimsFlowSelectedId,
  setSimsRunSelectedId,
  setViewedSimSpecHash,
} from "@/redux/slices/sims-slice";
import { useNavigate } from "react-router-dom";
import { GitBranchIcon } from "lucide-react";
import {
  setRunnerFlowSelectedId,
  setRunnerSimSelectedId,
} from "@/redux/slices/runner-slice";

type SimsListItemProps = {
  simsListItem: ForkSpecListItem;
};
export function SimsListItem({ simsListItem }: SimsListItemProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleView = () => {
    const runId = simsListItem.parentRunId;
    dispatch(setSimsFlowHash(simsListItem.flowDefHash));
    dispatch(setSimsFlowSelectedId(simsListItem.flowDefHash));
    dispatch(setViewedSimSpecHash(simsListItem.forkSpecHash));
    dispatch(
      setReusedStepIds({ flowId: simsListItem.flowDefHash, reused: [] }),
    );

    if (runId) dispatch(setSimsRunSelectedId(runId));
    navigate(`/sims/view`);
  };

  const handleRun = () => {
    const runId = simsListItem.parentRunId;
    dispatch(setRunnerSimSelectedId(simsListItem.forkSpecHash));
    dispatch(setRunnerFlowSelectedId(simsListItem.flowDefHash));

    if (runId) dispatch(setSimsRunSelectedId(runId));
    navigate(`/runner`);
  };
  return (
    <Item variant="muted">
      <ItemContent>
        <ItemTitle>{simsListItem?.name && simsListItem.name}</ItemTitle>
        <ItemDescription className="flex flex-col">
          {simsListItem.flowDefName} - {simsListItem.flowDefVersion}
          <br />
          {simsListItem.forkSpecHash}
          {simsListItem.forkSpecHash ? (
            <ItemMedia className="mb-0.5 flex justify-start">
              <GitBranchIcon size="20" />
            </ItemMedia>
          ) : null}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={handleView}
        >
          View
        </Button>
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={handleRun}
        >
          Run
        </Button>
      </ItemActions>
    </Item>
  );
}

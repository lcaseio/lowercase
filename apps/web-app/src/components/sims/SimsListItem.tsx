import type { SimListItem } from "@lcase/types";
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
  setViewedSimId,
} from "@/redux/slices/sims-slice";
import { useNavigate } from "react-router-dom";
import { GitBranchIcon } from "lucide-react";
import {
  setRunnerFlowSelectedId,
  setRunnerSimSelectedId,
} from "@/redux/slices/runner-slice";

type SimsListItemProps = {
  simsListItem: SimListItem;
};
export function SimsListItem({ simsListItem }: SimsListItemProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleView = () => {
    dispatch(setSimsFlowHash(simsListItem.flowVersion.definitionHash));
    dispatch(setSimsFlowSelectedId(simsListItem.sim.flowId));
    dispatch(setViewedSimId(simsListItem.sim.id));
    dispatch(
      setReusedStepIds({ flowId: simsListItem.sim.flowId, reused: [] }),
    );
    navigate(`/sims/view`);
  };

  const handleRun = () => {
    dispatch(setRunnerSimSelectedId(simsListItem.sim.id));
    dispatch(setRunnerFlowSelectedId(simsListItem.sim.flowId));
    navigate(`/runner`);
  };
  return (
    <Item variant="muted">
      <ItemContent>
        <ItemTitle>{simsListItem.sim.name}</ItemTitle>
        <ItemDescription className="flex flex-col">
          {simsListItem.flow.name} - {simsListItem.flowVersion.versionLabel}
          <br />
          {simsListItem.sim.forkSpecHash}
          {simsListItem.sim.forkSpecHash ? (
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

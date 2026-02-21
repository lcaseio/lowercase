import type { ForkSpecListItem } from "@lcase/types";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
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
  return (
    <Item variant="muted">
      <ItemContent>
        <ItemTitle>{simsListItem?.name && simsListItem.name}</ItemTitle>
        <ItemDescription>
          {simsListItem.flowDefName} - {simsListItem.flowDefVersion}
          <br />
          {simsListItem.forkSpecHash}
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
      </ItemActions>
    </Item>
  );
}

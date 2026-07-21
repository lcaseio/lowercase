import type { RunListItem } from "@lcase/types";
import { Button } from "../ui/button";
import { Link, useNavigate } from "react-router-dom";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "../ui/item";
import { useAppDispatch } from "@/redux/typed-hooks";
import {
  setSimsFlowHash,
  setSimsFlowSelectedId,
  setSimsRunSelectedId,
} from "@/redux/slices/sims-slice";
import { TestTubeDiagonalIcon } from "lucide-react";

export function RunListItem({ runListItem }: { runListItem: RunListItem }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const handleFork = () => {
    dispatch(setSimsFlowHash(runListItem.flowDefHash));
    dispatch(setSimsFlowSelectedId(null));
    dispatch(setSimsRunSelectedId(runListItem.runId));
    navigate("/sims/create");
  };
  return (
    <div>
      <Item variant="muted">
        <ItemContent className="">
          <ItemTitle>{runListItem.flowName}</ItemTitle>
          <ItemDescription>
            {runListItem.flowVersion + " "} -{" "}
            {runListItem.startTime
              ? new Date(runListItem.startTime).toLocaleTimeString() + " "
              : ""}
            -
            {runListItem.endTime
              ? " " + new Date(runListItem.endTime).toLocaleTimeString()
              : ""}
            {runListItem.duration ? " " + runListItem.duration + "s " : ""}
            <br />
            {runListItem.forkSpecHash ? (
              <ItemMedia className="mb-0.5 flex justify-start">
                {/* <GitBranchIcon size="20" /> */}
                <TestTubeDiagonalIcon size="20" />
              </ItemMedia>
            ) : null}
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Link to={`/runs/details/?runId=${runListItem.runId}`}>
            <Button variant="outline" size="sm" className="cursor-pointer">
              View
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={handleFork}
          >
            Fork
          </Button>
        </ItemActions>
      </Item>
    </div>
  );
}

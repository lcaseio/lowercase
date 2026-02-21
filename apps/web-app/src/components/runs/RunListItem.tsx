import type { RunListItem } from "@lcase/types";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "../ui/item";

export function RunListItem({ runListItem }: { runListItem: RunListItem }) {
  return (
    <div>
      <Item variant="muted">
        <ItemContent>
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
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Link
            to={`/runs/details/?runId=${runListItem.runId}&flowDefHash=${runListItem.flowDefHash}`}
          >
            <Button variant="outline" size="sm" className="cursor-pointer">
              View
            </Button>
          </Link>
        </ItemActions>
      </Item>
    </div>
  );
}

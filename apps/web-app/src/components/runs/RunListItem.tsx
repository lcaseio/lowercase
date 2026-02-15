import type { RunListItem } from "@lcase/types";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";

export function RunListItem({ runListItem }: { runListItem: RunListItem }) {
  return (
    <div>
      <p>
        <Button variant="link" className="pl-0 cursor-pointer">
          <Link
            to={`/runs/details/?runId=${runListItem.runId}&flowDefHash=${runListItem.flowDefHash}`}
          >
            {runListItem.flowName}
          </Link>
        </Button>
        <span className="text-foreground/80 text-sm pr-2">
          {runListItem.flowVersion + " "}
        </span>
        <span className="text-foreground/70 text-xs">
          {runListItem.startTime
            ? new Date(runListItem.startTime).toLocaleTimeString() + " "
            : ""}
          -
          {runListItem.endTime
            ? " " + new Date(runListItem.endTime).toLocaleTimeString()
            : ""}
          {runListItem.duration ? " " + runListItem.duration + "s " : ""}
        </span>
      </p>
      <p className="text-xs text-foreground/75"></p>
    </div>
  );
}

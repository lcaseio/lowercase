import type { FlowListItem } from "@lcase/types";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useAppDispatch } from "@/redux/typed-hooks";
import { setRunnerFlowSelectedId } from "@/redux/slices/runner-slice";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "./ui/item";

export function FlowListItem({ flowItem }: { flowItem: FlowListItem }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { flow, latestVersion } = flowItem;

  return (
    <Item variant="muted">
      <ItemContent>
        <ItemTitle>{flow.name}</ItemTitle>
        <ItemDescription>
          {latestVersion.versionLabel ?? `Version ${latestVersion.sequence}`}
          <br />
          {flow.description ? flow.description : ""}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Link to={`/flows/edit/${flow.id}`}>
          <Button variant="outline" size="sm" className="cursor-pointer">
            Edit
          </Button>
        </Link>

        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => {
            dispatch(setRunnerFlowSelectedId(flow.id));
            navigate(`/runner`);
          }}
        >
          Run
        </Button>
      </ItemActions>
    </Item>
  );
}

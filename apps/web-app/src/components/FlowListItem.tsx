import type { FlowIndex } from "@lcase/types";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useAppDispatch } from "@/redux/typed-hooks";
import {
  setRunnerFlowHash,
  setRunnerFlowSelectedId,
} from "@/redux/slices/runner-slice";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "./ui/item";

export function FlowListItem({ index }: { index: FlowIndex }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return (
    <Item variant="muted">
      <ItemContent>
        <ItemTitle>{index.name}</ItemTitle>
        <ItemDescription>
          {index.version}
          <br />
          {index.description ? index.description : ""}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Link to={`/flows/edit/${index.hash}`}>
          <Button variant="outline" size="sm" className="cursor-pointer">
            Edit
          </Button>
        </Link>

        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => {
            dispatch(setRunnerFlowSelectedId(index.hash));
            dispatch(setRunnerFlowHash(index.hash));
            navigate(`/runner`);
          }}
        >
          Run
        </Button>
      </ItemActions>
    </Item>
  );
}

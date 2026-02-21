import type { FlowIndex } from "@lcase/types";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useAppDispatch } from "@/redux/typed-hooks";
import { setFlowHash, setFlowSelectedId } from "@/redux/slices/runner-slice";
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
          {index.description ? <p> {index.description} </p> : ""}
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
            dispatch(setFlowSelectedId(index.hash));
            dispatch(setFlowHash(index.hash));
            navigate(`/runner`);
          }}
        >
          Run
        </Button>
      </ItemActions>
    </Item>
  );
}

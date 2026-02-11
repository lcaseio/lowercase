import type { FlowIndex } from "@lcase/types";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useAppDispatch } from "@/redux/typed-hooks";
import { setFlowHash, setFlowSelectedId } from "@/redux/slices/runner-slice";

export function FlowListItem({ index }: { index: FlowIndex }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return (
    <div className="mb-5">
      <p>
        <Button variant="link" className="cursor-pointer pl-0">
          <Link to={`/flows/edit/${index.hash}`}>{index.name}</Link>
        </Button>

        <span className="text-sm text-foreground/70">{index.version}</span>

        <Button
          variant="link"
          onClick={() => {
            dispatch(setFlowSelectedId(index.hash));
            dispatch(setFlowHash(index.hash));
            navigate(`/runner`);
          }}
        >
          Run
        </Button>
      </p>
      {index.description ? (
        <p className="text-sm text-foreground/70">{index.description}</p>
      ) : (
        ""
      )}
    </div>
  );
}

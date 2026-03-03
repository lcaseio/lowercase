import { useAppDispatch } from "@/redux/typed-hooks";
import { Button } from "../ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "../ui/item";
import {
  setRunsActiveTab,
  setRunsSelectedArtifactHash,
} from "@/redux/slices/runs-slice";

type RunArtifactItemProps = {
  item: string;
  hash: string | null;
};
export function RunArtifactListItem({ item, hash }: RunArtifactItemProps) {
  const dispatch = useAppDispatch();

  const handleView = () => {
    if (!hash) return;
    dispatch(setRunsSelectedArtifactHash(hash));
    dispatch(setRunsActiveTab("artifactViewer"));
  };
  return (
    <div>
      <Item variant="muted">
        <ItemContent>
          <ItemTitle>{item}</ItemTitle>
          <ItemDescription>Hash: {hash}</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button
            variant="outline"
            onClick={handleView}
            className="cursor-pointer"
          >
            View
          </Button>
        </ItemActions>
      </Item>
    </div>
  );
}

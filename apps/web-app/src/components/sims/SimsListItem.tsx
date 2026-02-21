import type { ForkSpecListItem } from "@lcase/types";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "../ui/item";
import { Button } from "../ui/button";

type SimsListItemProps = {
  simsListItem: ForkSpecListItem;
};
export function SimsListItem({ simsListItem }: SimsListItemProps) {
  return (
    <Item variant="muted">
      <ItemContent>
        <ItemTitle>{simsListItem?.name && simsListItem.name}</ItemTitle>
        <ItemDescription>
          {simsListItem.flowDefName} - {simsListItem.flowDefVersion}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button variant="outline" size="sm" className="cursor-pointer">
          View
        </Button>
      </ItemActions>
    </Item>
  );
}

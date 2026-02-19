import type { ForkSpecListItem } from "@lcase/types";

type SimsListItemProps = {
  simsListItem: ForkSpecListItem;
};
export function SimsListItem({ simsListItem }: SimsListItemProps) {
  return (
    <div>
      <p>
        {simsListItem.flowDefName} - {simsListItem.flowDefVersion}
      </p>
      {simsListItem.flowDefDescription ? (
        <p> {simsListItem.flowDefDescription}</p>
      ) : null}
    </div>
  );
}

import type { ForkSpecListItem } from "@lcase/types";

export function SimsListItem({
  simsListItem,
}: {
  simsListItem: ForkSpecListItem;
}) {
  return (
    <div>
      <p>
        {simsListItem.flowDefName} - {simsListItem.flowDefVersion}
      </p>
      <p>{simsListItem.flowDefDescription}</p>
    </div>
  );
}

import type { FlowListItem } from "@lcase/types";

type Props = { flowItem: FlowListItem };
export function RunnerFlowSelectOption({ flowItem }: Props) {
  return (
    <option value={flowItem.flow.id}>
      {flowItem.flow.name} -{" "}
      {flowItem.latestVersion.versionLabel ??
        `Version ${flowItem.latestVersion.sequence}`}
    </option>
  );
}

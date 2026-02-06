import type { FlowIndex } from "@lcase/types";

type Props = { flowIndex: FlowIndex };
export function RunnerFlowSelectOption({ flowIndex }: Props) {
  return (
    <option value={flowIndex.hash}>
      {flowIndex.name} - {flowIndex.version}
    </option>
  );
}

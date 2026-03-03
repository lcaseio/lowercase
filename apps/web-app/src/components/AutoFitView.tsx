import { useReactFlow } from "@xyflow/react";

export function AutoFitView() {
  const reactFlow = useReactFlow();
  reactFlow.fitView();
  return null;
}

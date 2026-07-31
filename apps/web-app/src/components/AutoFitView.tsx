import { useReactFlow } from "@xyflow/react";

export function AutoFitView() {
  const reactFlow = useReactFlow();
  reactFlow.fitView({ padding: 0.5 });
  return null;
}

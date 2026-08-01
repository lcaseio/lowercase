import type { FlowParamDefinition } from "@lcase/types";
import { FlowParameters } from "@/components/FlowParameters";

export function ParametersTab({
  params,
}: {
  params: Record<string, FlowParamDefinition>;
}) {
  return <FlowParameters label="Parameters" value={params} />;
}

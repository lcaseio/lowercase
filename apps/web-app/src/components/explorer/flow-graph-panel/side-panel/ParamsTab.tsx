import type {
  ArtifactListItem,
  FlowDefinition,
  FlowParamDefinition,
} from "@lcase/types";
import { FlowVersionRunParamRow } from "@/components/flow-version/FlowVersionRunParamRow";

type Props = {
  flowDef: FlowDefinition;
  params: Record<string, FlowParamDefinition>;
  artifacts: ArtifactListItem[];
  selectedParamHashes: Record<string, string>;
  onParamChange: (name: string, hash: string | undefined) => void;
  missingRequiredParams: string[];
};

export function ParamsTab({
  flowDef,
  params,
  artifacts,
  selectedParamHashes,
  onParamChange,
  missingRequiredParams,
}: Props) {
  if (Object.keys(params).length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        This flow does not declare any run params.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {Object.entries(params).map(([name, def]) => (
        <FlowVersionRunParamRow
          key={name}
          name={name}
          definition={def}
          artifacts={artifacts}
          selectedHash={selectedParamHashes[name]}
          onChange={onParamChange}
          flowDef={flowDef}
          refs={[]}
        />
      ))}
      {missingRequiredParams.length > 0 ? (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Select artifacts for all required params before running.
        </p>
      ) : null}
    </div>
  );
}

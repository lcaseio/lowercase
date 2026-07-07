import type { ArtifactIndex, FlowParamDefinition } from "@lcase/types";
import { isArtifactCompatible } from "@lcase/flow-analysis";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const UNSET_VALUE = "__unset__";
type Props = {
  name: string;
  definition: FlowParamDefinition;
  artifacts: ArtifactIndex[];
  selectedHash?: string;
  onChange: (name: string, hash: string | undefined) => void;
};

export function RunnerParamRow({
  name,
  definition,
  artifacts,
  selectedHash,
  onChange,
}: Props) {
  const isOptional = definition.optional === true;
  const compatibleArtifacts = artifacts.filter((artifact) =>
    isArtifactCompatible(artifact, definition.type),
  );
  const hasSelectedArtifactInList =
    selectedHash === undefined ||
    compatibleArtifacts.some((artifact) => artifact.hash === selectedHash);

  return (
    <div className="grid gap-2 lg:grid-cols-[220px_1fr] lg:items-center">
      <div>
        <div className="font-medium">{name}</div>
        <div className="text-xs text-slate-600 dark:text-slate-300">
          {definition.type} • {isOptional ? "optional" : "required"}
        </div>
      </div>

      <Select
        onValueChange={(value) => {
          onChange(name, value === UNSET_VALUE ? undefined : value);
        }}
        value={selectedHash ?? UNSET_VALUE}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select an artifact" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>{name}</SelectLabel>
            <SelectItem value={UNSET_VALUE}>
              {isOptional ? "No artifact selected" : "Select an artifact"}
            </SelectItem>
            {!hasSelectedArtifactInList && selectedHash ? (
              <SelectItem value={selectedHash}>
                {`Selected artifact unavailable or incompatible: ${selectedHash}`}
              </SelectItem>
            ) : null}
            {compatibleArtifacts.map((artifact) => (
              <SelectItem key={artifact.hash} value={artifact.hash}>
                {artifactLabel(artifact)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

function artifactLabel(artifact: ArtifactIndex): string {
  return artifact.label || artifact.filename || artifact.hash;
}

function isArtifactCompatible(
  artifact: ArtifactIndex,
  type: FlowParamDefinition["type"],
): boolean {
  if (artifact.contentType === type) return true;

  switch (type) {
    case "application/json":
      return artifact.format === "json";
    case "text/plain":
      return artifact.format === "text";
    case "text/markdown":
      return artifact.format === "markdown";
  }
}

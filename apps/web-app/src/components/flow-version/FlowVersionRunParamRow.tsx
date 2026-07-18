import type {
  ArtifactIndex,
  FlowDefinition,
  FlowParamDefinition,
  Ref,
} from "@lcase/types";
import { isArtifactCompatible } from "@lcase/flow-analysis";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Maximize2Icon, ListTreeIcon } from "lucide-react";
import { useLazyGetArtifactQuery } from "@/redux/api/artifacts-api";
import type { OpenInMainPanel } from "@/components/MainPanelTypes";
import {
  artifactFormatToLanguage,
  buildRefUsage,
  findParamRefs,
  renderParamRefReport,
} from "@/lib/ref-resolution";

const UNSET_VALUE = "__unset__";

type Props = {
  name: string;
  definition: FlowParamDefinition;
  artifacts: ArtifactIndex[];
  selectedHash?: string;
  onChange: (name: string, hash: string | undefined) => void;
  onOpenInMainPanel: OpenInMainPanel;
  flowDef: FlowDefinition | null;
  refs: Ref[];
};

// rendere a param row and its selection logic
export function FlowVersionRunParamRow({
  name,
  definition,
  artifacts,
  selectedHash,
  onChange,
  onOpenInMainPanel,
  flowDef,
  refs,
}: Props) {
  const [triggerGetArtifact, { isFetching }] = useLazyGetArtifactQuery();

  const isOptional = definition.optional === true;
  const compatibleArtifacts = artifacts.filter((artifact) =>
    isArtifactCompatible(artifact, definition.type),
  );
  const hasSelectedArtifactInList =
    selectedHash === undefined ||
    compatibleArtifacts.some((artifact) => artifact.hash === selectedHash);

  const selectedArtifact = artifacts.find((a) => a.hash === selectedHash);
  const canPreview = selectedArtifact && selectedArtifact.format !== "bytes";

  const paramRefs = findParamRefs(refs, name);
  const canShowUsages = canPreview && paramRefs.length > 0;

  async function handlePreview() {
    if (!selectedHash) return;
    const result = await triggerGetArtifact({ hash: selectedHash });
    if (!result.data?.ok) return;
    const data = result.data;
    if (data.format === "bytes") return;
    const value =
      data.format === "json" ? JSON.stringify(data.value, null, 2) : data.value;
    onOpenInMainPanel(
      `Param "${name}"`,
      value,
      artifactFormatToLanguage(data.format),
    );
  }

  async function handleShowUsages() {
    if (!selectedHash || !flowDef) return;
    const result = await triggerGetArtifact({ hash: selectedHash });
    if (!result.data?.ok || result.data.format === "bytes") return;
    const data = result.data;
    const usages = paramRefs.map((ref) => buildRefUsage(ref, flowDef, data));
    onOpenInMainPanel(
      `Param "${name}" usages`,
      renderParamRefReport(name, usages),
      "markdown",
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div>
        <div className="font-medium">{name}</div>
        <div className="text-xs text-slate-600 dark:text-slate-300">
          {definition.type} • {isOptional ? "optional" : "required"}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Select
          onValueChange={(value) => {
            onChange(name, value === UNSET_VALUE ? undefined : value);
          }}
          value={selectedHash ?? UNSET_VALUE}
        >
          <SelectTrigger className="w-60">
            <SelectValue placeholder="Select an artifact" />
          </SelectTrigger>
          <SelectContent className="">
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
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          disabled={!canPreview || isFetching}
          onClick={handlePreview}
          title="Preview artifact content"
        >
          <Maximize2Icon className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          disabled={!canShowUsages || isFetching}
          onClick={handleShowUsages}
          title="Show where this param is used"
        >
          <ListTreeIcon className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function artifactLabel(artifact: ArtifactIndex): string {
  return artifact.label || artifact.filename || artifact.hash;
}

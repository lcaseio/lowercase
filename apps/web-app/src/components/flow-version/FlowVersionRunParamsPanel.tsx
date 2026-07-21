import type { FlowDefinition, FlowParamDefinition, Ref } from "@lcase/types";
import { useListArtifactsQuery } from "@/redux/api/artifacts-api";
import { useRequestRunMutation } from "@/redux/api/runs-api";
import { useAppDispatch } from "@/redux/typed-hooks";
import { runSubmitted } from "@/redux/slices/flow-version-run-slice";
import { FlowVersionRunParamRow } from "@/components/flow-version/FlowVersionRunParamRow";
import { Button } from "@/components/ui/button";
import type { OpenInMainPanel } from "@/components/MainPanelTypes";

type Props = {
  flowId: string | null;
  flowVersionId: string | null;
  flowDefHash: string | null;
  flowDef: FlowDefinition | null;
  refs: Ref[];
  params: Record<string, FlowParamDefinition> | undefined;
  selectedParamHashes: Record<string, string>;
  runId: string | null;
  runCreatedAt: string | null;
  onParamChange: (name: string, hash: string | undefined) => void;
  onClearRun: () => void;
  onOpenInMainPanel: OpenInMainPanel;
};

export function FlowVersionRunParamsPanel({
  flowId,
  flowVersionId,
  flowDefHash,
  flowDef,
  refs,
  params,
  selectedParamHashes,
  runId,
  runCreatedAt,
  onParamChange,
  onClearRun,
  onOpenInMainPanel,
}: Props) {
  const { data, isLoading, error } = useListArtifactsQuery();
  const artifacts = data?.ok ? data.value : [];
  const [requestRun, { isLoading: isSubmitting }] = useRequestRunMutation();
  const dispatch = useAppDispatch();

  const requiredParamNames = params
    ? Object.entries(params)
        .filter(([, def]) => def.optional !== true)
        .map(([name]) => name)
    : [];
  const missingRequiredParams = requiredParamNames.filter(
    (name) => !selectedParamHashes[name],
  );
  const runDisabled =
    !flowId ||
    !flowVersionId ||
    !flowDefHash ||
    isSubmitting ||
    missingRequiredParams.length > 0;

  const handleRun = async () => {
    if (!flowId || !flowVersionId || !flowDefHash) return;
    const entries = Object.entries(selectedParamHashes).filter(([, hash]) =>
      Boolean(hash),
    );
    const result = await requestRun({
      flowId,
      flowVersionId,
      flowDefHash,
      ...(entries.length > 0 ? { params: Object.fromEntries(entries) } : {}),
    });
    if (result.data?.ok) {
      dispatch(runSubmitted({ runId: result.data.runId }));
    }
  };

  return (
    <div className="flex flex-col gap-4 p-3">
      <h3 className="font-semibold">Run Params</h3>

      {runId ? (
        <div className="rounded-md border border-neutral-500 dark:border-neutral-700 p-3 flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Last run:{" "}
            {runCreatedAt ? new Date(runCreatedAt).toLocaleString() : "?"}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={onClearRun}
          >
            Clear / Start New Run
          </Button>
        </div>
      ) : null}

      {!params || Object.keys(params).length === 0 ? (
        <div className="rounded-md border border-neutral-500 dark:border-neutral-700 p-3">
          This flow does not declare any run params.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {isLoading ? <div>Loading artifacts...</div> : null}
          {data?.ok === false ? (
            <div>Error loading artifacts: {data.error}</div>
          ) : null}
          {error ? <div>Error loading artifacts</div> : null}
          {Object.entries(params).map(([name, def]) => (
            <FlowVersionRunParamRow
              key={name}
              name={name}
              definition={def}
              artifacts={artifacts}
              selectedHash={selectedParamHashes[name]}
              onChange={onParamChange}
              onOpenInMainPanel={onOpenInMainPanel}
              flowDef={flowDef}
              refs={refs}
            />
          ))}
          {missingRequiredParams.length > 0 ? (
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Select artifacts for all required params before running.
            </p>
          ) : null}
        </div>
      )}

      <Button
        className="cursor-pointer bg-green-200 dark:bg-green-900"
        variant="outline"
        onClick={handleRun}
        disabled={runDisabled}
      >
        Run
      </Button>
    </div>
  );
}

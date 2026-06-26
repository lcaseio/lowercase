import { useListArtifactsQuery } from "@/redux/api/artifacts-api";
import type { FlowParamDefinition } from "@lcase/types";

import { RunnerParamRow } from "./RunnerParamRow";

type Props = {
  flowSelectedId: string | null;
  params: Record<string, FlowParamDefinition> | undefined;
  selectedParams: Record<string, string>;
  onChange: (name: string, hash: string | undefined) => void;
};

export function RunnerParamsPanel({
  flowSelectedId,
  params,
  selectedParams,
  onChange,
}: Props) {
  const { data, isLoading, error } = useListArtifactsQuery();
  const artifacts = data?.ok ? data.value : [];

  if (!flowSelectedId) {
    return (
      <div className="rounded-md border border-neutral-500 p-4 dark:border-neutral-700">
        Select a flow to configure run params.
      </div>
    );
  }

  if (!params || Object.keys(params).length === 0) {
    return (
      <div className="rounded-md border border-neutral-500 p-4 dark:border-neutral-700">
        The selected flow does not declare any run params.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-neutral-500 p-4 dark:border-neutral-700">
      <div className="mb-4">
        <h3 className="font-bold">Run Params</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Select an indexed artifact for each declared param.
        </p>
      </div>
      {isLoading ? <div>Loading artifacts...</div> : null}
      {data?.ok === false ? (
        <div>Error loading artifacts: {data.error}</div>
      ) : null}
      {error ? <div>Error loading artifacts</div> : null}
      {!isLoading && artifacts.length === 0 ? (
        <div>No indexed artifacts are available yet.</div>
      ) : null}
      <div className="flex flex-col gap-4">
        {Object.entries(params).map(([name, def]) => (
          <RunnerParamRow
            key={name}
            name={name}
            definition={def}
            artifacts={artifacts}
            selectedHash={selectedParams[name]}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}

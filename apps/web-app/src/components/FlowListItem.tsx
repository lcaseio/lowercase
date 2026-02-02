import type { FlowIndex } from "@lcase/types";

export function FlowListItem({ index }: { index: FlowIndex }) {
  return (
    <div className="mb-5">
      <p>
        <span className="font-bold text-sm">{index.name}</span>
        <span className="text-sm ml-3 text-slate-300">{index.version}</span>
      </p>
      {index.description ? (
        <p className="text-sm text-slate-300">{index.description}</p>
      ) : (
        ""
      )}
    </div>
  );
}

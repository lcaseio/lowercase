import { useGetFlowVersionsQuery } from "@/redux/api/flows-api";
import { useDelayedLoading } from "@/hooks/use-delayed-loading";
import { ExplorerVersionRow } from "./ExplorerVersionRow";

export function ExplorerVersionList({
  flowId,
  selectedRowId,
  onSelectVersion,
}: {
  flowId: string;
  selectedRowId: string | null;
  onSelectVersion: (versionId: string) => void;
}) {
  const { data, error, isLoading } = useGetFlowVersionsQuery(flowId);
  const showLoading = useDelayedLoading(isLoading);

  if (isLoading)
    return showLoading ? (
      <div className="pl-10 py-1 text-sm text-muted-foreground">
        Loading versions...
      </div>
    ) : null;
  if (data?.ok === false)
    return (
      <div className="pl-10 py-1 text-sm text-destructive">
        Error loading versions: {data.error}
      </div>
    );
  if (error || !data)
    return (
      <div className="pl-10 py-1 text-sm text-destructive">
        Error loading versions
      </div>
    );

  return (
    <>
      {data.value.map((version) => (
        <ExplorerVersionRow
          key={version.id}
          version={version}
          isSelected={selectedRowId === `version:${version.id}`}
          onSelect={() => onSelectVersion(version.id)}
        />
      ))}
    </>
  );
}

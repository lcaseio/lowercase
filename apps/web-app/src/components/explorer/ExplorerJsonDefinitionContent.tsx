import { useEffect } from "react";
import { toast } from "sonner";
import { useGetFlowVersionDefQuery } from "@/redux/api/flows-api";
import { CodeEditor } from "@/components/CodeEditor";

export function ExplorerJsonDefinitionContent({
  versionId,
}: {
  versionId: string;
}) {
  const { data, error, isLoading, refetch } =
    useGetFlowVersionDefQuery(versionId);

  const hasError = error || data?.ok === false;
  useEffect(() => {
    if (hasError) {
      toast.error("Couldn't load the flow definition", {
        duration: Infinity,
      });
    }
  }, [hasError]);

  if (isLoading) return <div className="p-4">Loading JSON definition...</div>;
  if (hasError)
    return (
      <div className="p-4 text-sm text-destructive">
        Couldn't load the flow definition.{" "}
        <button className="underline" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  if (!data || !data.ok) return null;

  return (
    <CodeEditor
      language="json"
      value={JSON.stringify(data.value.definition, null, 2)}
      height="100%"
      readOnly
    />
  );
}

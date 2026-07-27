import { useEffect } from "react";
import { toast } from "sonner";
import { useGetFlowVersionDefQuery } from "@/redux/api/flows-api";
import { IdentityField } from "@/components/fields/IdentityField";
import { InputField } from "@/components/fields/InputField";

export function ExplorerVersionSettingsContent({
  versionId,
}: {
  versionId: string;
}) {
  const { data, error, isLoading, refetch } =
    useGetFlowVersionDefQuery(versionId);

  const hasError = error || data?.ok === false;
  useEffect(() => {
    if (hasError) {
      toast.error("Couldn't load version settings", { duration: Infinity });
    }
  }, [hasError]);

  if (isLoading) return <div className="p-4">Loading version settings...</div>;
  if (hasError)
    return (
      <div className="p-4 text-sm text-destructive">
        Couldn't load version settings.{" "}
        <button className="underline" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  if (!data || !data.ok) return null;

  const { version } = data.value;

  return (
    <div className="p-4 flex flex-col gap-3">
      <IdentityField label="Id" value={version.id} />
      <IdentityField label="Sequence" value={String(version.sequence)} />
      <IdentityField label="Hash" value={version.definitionHash} />
      <IdentityField label="Created" value={version.createdAt} />
      <InputField label="Label" value={version.versionLabel} />
      <InputField label="Description" value={version.description} />
    </div>
  );
}

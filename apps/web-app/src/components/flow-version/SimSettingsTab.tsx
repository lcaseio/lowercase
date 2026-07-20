import type { SimRecord } from "@lcase/types";

type Props = {
  sim: SimRecord | null;
  parentRunId: string | null;
};

// details-panel tab while browsing sims -- shows the currently viewed sim's
// full name/description (list rows truncate theirs) and its fork spec's
// parent run id. null while authoring, since a draft has no sim/fork spec yet
export function SimSettingsTab({ sim, parentRunId }: Props) {
  if (!sim) {
    return (
      <p className="mt-3 text-sm text-muted-foreground">
        Sim details will appear here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h2>{sim.name}</h2>
      <div>
        <h3 className="text-xs font-medium text-muted-foreground">
          Description
        </h3>
        <p className="text-sm whitespace-pre-wrap">
          {sim.description ?? "no description"}
        </p>
      </div>
      {parentRunId && (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground">
            Parent Run
          </h3>
          <p className="text-sm font-mono break-all">{parentRunId}</p>
        </div>
      )}
    </div>
  );
}

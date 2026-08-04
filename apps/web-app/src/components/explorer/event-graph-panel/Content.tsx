import { useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { EventGraph } from "@/components/EventGraph";
import { useRunEventsWithStatus } from "@/hooks/use-run-events-with-status";
import { useGetFlowVersionDefQuery } from "@/redux/api/flows-api";
import { useGetRunDetailQuery } from "@/redux/api/runs-api";
import { useGetSimQuery } from "@/redux/api/sims-api";
import { useTrackedFlowGraphPanel } from "./use-tracked-flow-graph-panel";

// The one singleton EventGraph panel. What it's currently showing comes
// entirely from useTrackedFlowGraphPanel -- everything below is just
// fetching display data for {runId, versionId} and rendering it.
export function Content({
  initialTrackedPanelId,
}: {
  initialTrackedPanelId?: string;
}) {
  const { runId, versionId } = useTrackedFlowGraphPanel(initialTrackedPanelId);

  // Same pattern the hook uses internally: reset the selection whenever the
  // displayed run changes, computed during render rather than in an effect.
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEventResetKey, setSelectedEventResetKey] = useState<
    string | null
  >(runId);
  if (runId !== selectedEventResetKey) {
    setSelectedEventResetKey(runId);
    setSelectedEventId(null);
  }

  const { data: versionData } = useGetFlowVersionDefQuery(
    versionId ?? skipToken,
  );
  const version = versionData?.ok ? versionData.value.version : null;

  const { data: runDetailData } = useGetRunDetailQuery(
    runId ? { runId } : skipToken,
  );
  const simId = runDetailData?.ok ? runDetailData.value.run.simId : undefined;
  const { data: simDefData } = useGetSimQuery(simId ? { simId } : skipToken);
  const simDefinition = simDefData?.ok ? simDefData.value : null;

  const headerText = (() => {
    if (!version) return "No flow graph panel focused";
    const versionPart = version.versionLabel ?? `Version ${version.sequence}`;
    if (!runId) return `${versionPart} — no run yet`;
    if (simDefinition) return `${versionPart} — ${simDefinition.sim.name}`;
    const startTime = runDetailData?.ok
      ? runDetailData.value.run.startTime
      : undefined;
    const runLabel = startTime
      ? new Date(startTime).toLocaleString(undefined, {
          dateStyle: "short",
          timeStyle: "short",
        })
      : runId;
    return `${versionPart} — ${runLabel}`;
  })();

  const { events } = useRunEventsWithStatus(runId, []);

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b px-3 py-1.5 text-sm text-muted-foreground">
        {headerText}
      </div>
      <div className="min-h-0 flex-1">
        <EventGraph
          events={events}
          selectedEventId={selectedEventId}
          onEventClick={setSelectedEventId}
        />
      </div>
    </div>
  );
}

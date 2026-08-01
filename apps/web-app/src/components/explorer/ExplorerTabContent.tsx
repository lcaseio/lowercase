import type { IDockviewPanelProps } from "dockview-react";
import type { OpenPanelRequest } from "./explorer-panels";
import { ExplorerFlowSettingsContent } from "./ExplorerFlowSettingsContent";
import { ExplorerVersionSettingsContent } from "./ExplorerVersionSettingsContent";
import { ExplorerJsonDefinitionContent } from "./ExplorerJsonDefinitionContent";
import { Content as FlowGraphPanelContent } from "./flow-graph-panel/Content";

// registered as dockview's "explorer-tab" component (see explorer-panels.ts)
// -- each panel gets its own distinct id per kind+content now, so a panel is
// never reused for different content the way the old singleton tab was.
export function ExplorerTabContent({
  params,
  api,
}: IDockviewPanelProps<OpenPanelRequest>) {
  switch (params.kind) {
    case "flow-settings":
      return <ExplorerFlowSettingsContent flowId={params.flowId} />;
    case "version-settings":
      return <ExplorerVersionSettingsContent versionId={params.versionId} />;
    case "json-definition":
      return <ExplorerJsonDefinitionContent versionId={params.versionId} />;
    case "flow-graph":
      return (
        <FlowGraphPanelContent versionId={params.versionId} panelId={api.id} />
      );
    default: {
      const _exhaustive: never = params;
      return _exhaustive;
    }
  }
}

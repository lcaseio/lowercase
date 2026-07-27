import type { ExplorerTabEntry } from "@/redux/slices/explorer-tabs-slice";
import { ExplorerFlowSettingsContent } from "./ExplorerFlowSettingsContent";
import { ExplorerVersionSettingsContent } from "./ExplorerVersionSettingsContent";
import { ExplorerJsonDefinitionContent } from "./ExplorerJsonDefinitionContent";
import { ExplorerFlowGraphContent } from "./ExplorerFlowGraphContent";

export function ExplorerTabContent({ tab }: { tab: ExplorerTabEntry }) {
  switch (tab.kind) {
    case "flow-settings":
      return <ExplorerFlowSettingsContent flowId={tab.flowId} />;
    case "version-settings":
      return <ExplorerVersionSettingsContent versionId={tab.versionId} />;
    case "json-definition":
      return <ExplorerJsonDefinitionContent versionId={tab.versionId} />;
    case "flow-graph":
      // keyed on versionId -- this tab is a singleton, so switching to a
      // different version updates this same component's props in place
      // rather than remounting it, meaning the same useGetFlowVersionDefQuery
      // hook instance would otherwise transition between two different
      // query args instead of starting a fresh subscription. The key forces
      // a full remount of the whole data-fetching subtree, not just the
      // graph rendering inside it.
      return (
        <ExplorerFlowGraphContent
          key={tab.versionId}
          versionId={tab.versionId}
        />
      );
    default: {
      const _exhaustive: never = tab;
      return _exhaustive;
    }
  }
}

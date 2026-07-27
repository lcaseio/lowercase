import type { ExplorerTabEntry } from "@/redux/slices/explorer-tabs-slice";

export function ExplorerTabContent({ tab }: { tab: ExplorerTabEntry }) {
  switch (tab.kind) {
    case "placeholder-version":
      return (
        <div className="p-4 text-sm text-muted-foreground">
          Version placeholder — versionId: {tab.versionId}. Real content
          lands in a later PR.
        </div>
      );
    case "placeholder-flow-settings":
      return (
        <div className="p-4 text-sm text-muted-foreground">
          Flow settings placeholder — flowId: {tab.flowId}. Real
          name/description editing lands in a later PR.
        </div>
      );
    default: {
      const _exhaustive: never = tab;
      return _exhaustive;
    }
  }
}

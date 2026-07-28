import type {
  ArtifactListItem,
  FlowDefinition,
  FlowParamDefinition,
} from "@lcase/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FlaskConicalIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";
import { FlowVersionRunParamRow } from "@/components/flow-version/FlowVersionRunParamRow";

export type ExplorerRunRightPanelTab = "params" | "sim";

type Props = {
  activeTab: ExplorerRunRightPanelTab;
  onActiveTabChange: (tab: ExplorerRunRightPanelTab) => void;
  onClose: () => void;
  flowDef: FlowDefinition;
  params: Record<string, FlowParamDefinition>;
  artifacts: ArtifactListItem[];
  selectedParamHashes: Record<string, string>;
  onParamChange: (name: string, hash: string | undefined) => void;
  missingRequiredParams: string[];
};

// scoped to the Flow Graph tab only -- own local tab state (owned by the
// caller, same fully-controlled shape as FlowVersionRunDetailsPanel), not
// the main Explorer tab registry in explorer-tabs-slice.ts.
export function ExplorerRunRightPanel({
  activeTab,
  onActiveTabChange,
  onClose,
  flowDef,
  params,
  artifacts,
  selectedParamHashes,
  onParamChange,
  missingRequiredParams,
}: Props) {
  return (
    <div className="flex h-full flex-col">
      <Tabs
        value={activeTab}
        onValueChange={(v) => onActiveTabChange(v as ExplorerRunRightPanelTab)}
        className="h-full flex flex-col"
      >
        <div className="flex items-center justify-between border-b">
          <TabsList variant="line">
            <TabsTrigger value="params">
              <SlidersHorizontalIcon />
              Params
            </TabsTrigger>
            <TabsTrigger value="sim">
              <FlaskConicalIcon />
              Sim
            </TabsTrigger>
          </TabsList>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 mr-1 cursor-pointer"
            onClick={onClose}
            title="Close panel"
          >
            <XIcon className="size-4" />
          </Button>
        </div>
        <TabsContent
          value="params"
          className="flex-1 min-h-0 overflow-auto p-3"
        >
          {Object.keys(params).length === 0 ? (
            <div className="text-sm text-muted-foreground">
              This flow does not declare any run params.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {Object.entries(params).map(([name, def]) => (
                <FlowVersionRunParamRow
                  key={name}
                  name={name}
                  definition={def}
                  artifacts={artifacts}
                  selectedHash={selectedParamHashes[name]}
                  onChange={onParamChange}
                  flowDef={flowDef}
                  refs={[]}
                />
              ))}
              {missingRequiredParams.length > 0 ? (
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Select artifacts for all required params before running.
                </p>
              ) : null}
            </div>
          )}
        </TabsContent>
        <TabsContent value="sim" className="flex-1 min-h-0 overflow-auto p-3">
          <div className="text-sm text-muted-foreground">
            Sim selection isn't wired up yet.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

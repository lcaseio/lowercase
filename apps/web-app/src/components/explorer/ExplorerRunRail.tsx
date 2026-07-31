import { useState } from "react";
import { FlaskConicalIcon, SlidersHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ExplorerRunRightPanelTab } from "./ExplorerRunRightPanelContent";

type Props = {
  activeTab: ExplorerRunRightPanelTab | null;
  onSelectTab: (tab: ExplorerRunRightPanelTab) => void;
};

const RAIL_ITEMS: {
  tab: ExplorerRunRightPanelTab;
  label: string;
  icon: typeof SlidersHorizontalIcon;
}[] = [
  { tab: "params", label: "Params", icon: SlidersHorizontalIcon },
  { tab: "sim", label: "Sim", icon: FlaskConicalIcon },
];

// Always-visible, fixed-width vertical rail between the graph and the
// (optional) content pane. Icons always *select* a tab, never toggle it
// closed on re-click -- matches ExplorerRunToolbar's onOpenParams/onOpenSim.
export function ExplorerRunRail({ activeTab, onSelectTab }: Props) {
  // Mirrors each tooltip's own open state so TooltipContent can be
  // unmounted outright on close, instead of going through Radix's
  // animated-exit path -- that path's reliance on a CSS animationend
  // event was producing an inconsistent stutter on close.
  const [openTab, setOpenTab] = useState<ExplorerRunRightPanelTab | null>(null);

  return (
    <div className="flex h-full w-12 shrink-0 flex-col items-center gap-1 py-2">
      {RAIL_ITEMS.map(({ tab, label, icon: Icon }) => (
        <Tooltip
          key={tab}
          delayDuration={700}
          onOpenChange={(isOpen) => setOpenTab(isOpen ? tab : null)}
        >
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "cursor-pointer",
                activeTab === tab && "bg-accent text-accent-foreground",
              )}
              onClick={() => onSelectTab(tab)}
            >
              <Icon className="size-4" />
            </Button>
          </TooltipTrigger>
          {openTab === tab && (
            <TooltipContent side="left">{label}</TooltipContent>
          )}
        </Tooltip>
      ))}
    </div>
  );
}

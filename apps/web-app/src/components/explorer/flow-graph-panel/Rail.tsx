import { useState } from "react";
import {
  CircleAlertIcon,
  FileInputIcon,
  FlaskConicalIcon,
  Footprints,
  SettingsIcon,
  SlidersHorizontalIcon,
  VariableIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { SidePanelTab } from "./SidePanel";

type Props = {
  activeTab: SidePanelTab | null;
  onSelectTab: (tab: SidePanelTab) => void;
  problemsCount?: number;
};

const RAIL_ITEMS: {
  tab: SidePanelTab;
  label: string;
  icon: typeof SlidersHorizontalIcon;
}[] = [
  { tab: "settings", label: "Settings", icon: SettingsIcon },
  { tab: "stepdetails", label: "Step Details", icon: Footprints },
  { tab: "parameters", label: "Parameters", icon: VariableIcon },
  { tab: "runinput", label: "Run Input", icon: FileInputIcon },
  { tab: "sim", label: "Sim", icon: FlaskConicalIcon },
  { tab: "problems", label: "Problems", icon: CircleAlertIcon },
];

// Always-visible, fixed-width vertical rail between the graph and the
// (optional) content pane. Icons always *select* a tab, never toggle it
// closed on re-click -- matches RunToolbar's onOpenParams/onOpenSim.
export function Rail({ activeTab, onSelectTab, problemsCount }: Props) {
  // Mirrors each tooltip's own open state so TooltipContent can be
  // unmounted outright on close, instead of going through Radix's
  // animated-exit path -- that path's reliance on a CSS animationend
  // event was producing an inconsistent stutter on close.
  const [openTab, setOpenTab] = useState<SidePanelTab | null>(null);

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
                "relative cursor-pointer",
                activeTab === tab && "bg-accent text-accent-foreground",
              )}
              onClick={() => onSelectTab(tab)}
            >
              <Icon className="size-4" />
              {tab === "problems" && problemsCount ? (
                <span className="absolute -right-1 -top-1 rounded px-1 text-xs bg-cyan-900 text-cyan-100 pointer-events-none">
                  {problemsCount}
                </span>
              ) : null}
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

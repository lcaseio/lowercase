import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboardIcon,
  FlaskConicalIcon,
  WorkflowIcon,
  BotIcon,
  FileTextIcon,
  ScaleIcon,
  SettingsIcon,
  RocketIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboardIcon },
  { to: "/spike", label: "Spike", icon: FlaskConicalIcon },
  { to: "/explorer", label: "Explorer", icon: RocketIcon },
  { to: "/flows", label: "Flows", icon: WorkflowIcon },
  { to: "/sims", label: "Sims", icon: BotIcon },
  { to: "/artifacts", label: "Artifacts", icon: FileTextIcon },
  { to: "/evals", label: "Evals", icon: ScaleIcon },
  { to: "/system", label: "System", icon: SettingsIcon },
];

export function AppShell() {
  const location = useLocation();

  return (
    // Tooltip provider stays even though the rail itself no longer needs it
    // (label is always visible now) -- Rail.tsx in both the flow-graph-panel
    // and event-graph-panel directories rely on this app-root provider as
    // their own Tooltip's Radix context ancestor.
    <TooltipProvider>
      <div className="h-screen flex">
        <nav className="w-16 shrink-0 flex flex-col items-center gap-1 py-2 border-r border-r-neutral-200 dark:border-r-neutral-800 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 w-14 rounded-md py-1.5 text-[10px] leading-none transition-colors",
                  isActive
                    ? "text-foreground bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/40",
                )}
              >
                <item.icon className="size-4" />
                <span className="truncate max-w-full">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="flex-1 min-h-0 overflow-auto">
          <Outlet />
        </div>
      </div>
    </TooltipProvider>
  );
}

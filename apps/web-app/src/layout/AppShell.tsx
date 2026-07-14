import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboardIcon,
  FlaskConicalIcon,
  PlayIcon,
  WorkflowIcon,
  BotIcon,
  ListIcon,
  FileTextIcon,
  ScaleIcon,
  SettingsIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboardIcon },
  { to: "/spike", label: "Spike", icon: FlaskConicalIcon },
  { to: "/runner", label: "Runner", icon: PlayIcon },
  { to: "/flows", label: "Flows", icon: WorkflowIcon },
  { to: "/sims", label: "Sims", icon: BotIcon },
  { to: "/runs", label: "Runs", icon: ListIcon },
  { to: "/artifacts", label: "Artifacts", icon: FileTextIcon },
  { to: "/evals", label: "Evals", icon: ScaleIcon },
  { to: "/system", label: "System", icon: SettingsIcon },
];

export function AppShell() {
  const location = useLocation();

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar
          collapsible="icon"
          className="border-r-neutral-200 dark:border-r-neutral-800"
        >
          <SidebarHeader className="flex-row items-center justify-between">
            <span className="font-bold text-md px-2 group-data-[collapsible=icon]:hidden">
              lowercase
            </span>
            <SidebarTrigger />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const isActive =
                      item.to === "/"
                        ? location.pathname === "/"
                        : location.pathname.startsWith(item.to);
                    return (
                      <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.label}
                          className="[&>svg]:size-5 mt-1"
                        >
                          <Link to={item.to}>
                            <item.icon />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter></SidebarFooter>
        </Sidebar>
        <SidebarInset className="h-screen overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 overflow-auto">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

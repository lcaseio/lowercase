import { Link, useLocation } from "react-router-dom";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  BotIcon,
  EditIcon,
  EyeIcon,
  FileTextIcon,
  ScaleIcon,
  ScrollTextIcon,
  TerminalIcon,
} from "lucide-react";

const modes = [
  { path: "edit", label: "Edit", icon: EditIcon },
  { path: "view", label: "View", icon: EyeIcon },
  { path: "run", label: "Run", icon: TerminalIcon },
  { path: "runs", label: "Run History", icon: ScrollTextIcon },
  { path: "sims", label: "Sims", icon: BotIcon },
  { path: "artifacts", label: "Artifacts", icon: FileTextIcon },
  { path: "evals", label: "Evals", icon: ScaleIcon },
];

export function FlowVersionModeNav() {
  const location = useLocation();
  const activeMode = location.pathname.split("/").filter(Boolean).pop();

  return (
    <ToggleGroup
      type="single"
      value={activeMode}
      className="w-full flex justify-center overflow-hidden rounded-none text-sky-800 dark:text-sky-300 dark:bg-sky-950 bg-sky-200"
    >
      {modes.map((mode) => (
        <ToggleGroupItem value={mode.path} key={mode.path} asChild>
          <Link to={mode.path}>
            <mode.icon />
            {mode.label}
          </Link>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

import { LaptopIcon, MoonIcon, SunIcon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTheme } from "../contexts/use-theme";
import type { Theme } from "../contexts/use-theme";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={theme}
      onValueChange={(value) => {
        if (value) setTheme(value as Theme);
      }}
      className="mt-2"
    >
      <ToggleGroupItem value="system" aria-label="Use system theme">
        <LaptopIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="light" aria-label="Use light theme">
        <SunIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" aria-label="Use dark theme">
        <MoonIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

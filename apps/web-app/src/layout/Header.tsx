import { ModeToggle } from "@/components/mode-toggle";
import { Nav } from "./Nav";

export function Header() {
  return (
    <header className="flex items-center gap-4 border-b border-border bg-background text-foreground px-3 py-2">
      <h2 className="font-bold text-md">lowercase</h2>
      <ModeToggle />
      <Nav />
    </header>
  );
}

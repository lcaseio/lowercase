import { Nav } from "./Nav";

export function Header() {
  return (
    <header className="flex justify-between gap-4 border-b border-border bg-background text-foreground px-3 py-2">
      <h2 className="font-bold text-md ml-0 pl-0">lowercase</h2>
      <Nav />
    </header>
  );
}

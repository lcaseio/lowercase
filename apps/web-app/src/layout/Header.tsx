import { Nav } from "./Nav";

export function Header() {
  return (
    <header className="flex justify-between items-center gap-4 border-b border-border bg-background text-foreground px-0 py-2 mb-2">
      <h2 className="font-bold text-md ml-0 pl-0">lowercase</h2>
      <Nav />
    </header>
  );
}

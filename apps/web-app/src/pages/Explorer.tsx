import { ExplorerTree } from "@/components/explorer/ExplorerTree";

export function Explorer() {
  return (
    <div className="p-4 dark:bg-neutral-850">
      <h2 className="text-xl font-bold mb-5">Explorer</h2>
      <ExplorerTree />
    </div>
  );
}

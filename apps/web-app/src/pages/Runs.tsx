import { RunList } from "@/components/runs/RunList";

export function Runs() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-5">Runs</h2>
      <RunList />
    </div>
  );
}

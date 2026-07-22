import type { ArtifactListItem } from "@lcase/types";
import { Button } from "../ui/button";

type Props = {
  artifacts: ArtifactListItem[];
  selectedHash: string | null;
  onSelect: (hash: string) => void;
};

export function ArtifactList({ artifacts, selectedHash, onSelect }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {artifacts.map((item) => {
        const { artifact } = item;
        const isSelected = artifact.hash === selectedHash;
        return (
          <button
            key={artifact.hash}
            className={`text-left rounded-md border p-3 transition ${
              isSelected
                ? "border-neutral-400 bg-cyan-50 dark:bg-neutral-700"
                : "border-slate-300 dark:border-neutral-700 bg-neutral-100 border-0 dark:bg-neutral-800"
            }`}
            onClick={() => onSelect(artifact.hash)}
            type="button"
          >
            <div className="font-semibold">
              {artifact.label ||
                artifact.filename ||
                artifact.hash.slice(0, 10) + "..."}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              {artifact.format || "unknown"} •{" "}
              {artifact.filename || "no filename"}
            </div>
            <div className="text-xs font-mono break-all mt-2">
              {artifact.hash}
            </div>
            <div className="text-xs mt-1 flex align-middle justify-between">
              {artifact.time}{" "}
              <Button
                size="xs"
                className="cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(artifact.hash);
                }}
              >
                Copy Hash
              </Button>
            </div>
            <div></div>
          </button>
        );
      })}
    </div>
  );
}

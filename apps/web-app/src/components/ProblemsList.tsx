import type { FlowProblem } from "@lcase/types";
import { formatProblem } from "@lcase/flow-analysis";
import { CircleXIcon } from "lucide-react";

type Props = {
  problems: FlowProblem[];
};

export function ProblemsList({ problems }: Props) {
  if (problems.length === 0) {
    return <p className="text-sm text-muted-foreground">No problems found.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {problems.map((problem, index) => (
        <li
          key={index}
          className="flex items-start gap-2 rounded-md  px-3 py-2 text-sm"
        >
          <CircleXIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
          <span>{formatProblem(problem)}</span>
        </li>
      ))}
    </ul>
  );
}

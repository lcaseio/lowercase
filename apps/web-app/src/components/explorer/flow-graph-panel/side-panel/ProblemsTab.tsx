import type { FlowProblem } from "@lcase/types";
import { FlowProblemsList } from "@/components/FlowProblemsList";

export function ProblemsTab({ problems }: { problems: FlowProblem[] }) {
  return <FlowProblemsList problems={problems} />;
}

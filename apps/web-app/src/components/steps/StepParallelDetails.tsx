import type { StepParallel } from "@lcase/types";
import { InputField } from "../fields/InputField";
import { InputListField } from "../fields/InputListField";

export function StepParallelDetails({ step }: { step: StepParallel }) {
  return (
    <div className="flex flex-col gap-3 mt-3">
      <InputField label="Type" value={step.type} />
      <InputListField label="Steps" value={step.steps} />
    </div>
  );
}

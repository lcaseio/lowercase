import type { StepJoin } from "@lcase/types";
import { InputField } from "./InputField";
import { InputListField } from "./InputListField";

export function StepJoinDetails({ step }: { step: StepJoin }) {
  return (
    <div className="flex flex-col gap-3 mt-3">
      <InputField label="Type" value={step.type} />
      <InputListField label="Steps" value={step.steps} ordered={false} />
      <InputField label="Next" value={step.next} />
    </div>
  );
}

import type { StepJoin } from "@lcase/types";
import { InputField } from "./InputField";

export function StepJoinDetails({ step }: { step: StepJoin }) {
  return (
    <div className="flex flex-col gap-3 mt-3">
      <InputField label="Type" value={step.type} />
    </div>
  );
}

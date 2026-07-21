import { usePostSimsMutation } from "@/redux/api/sims-api";
import { Button } from "../ui/button";
import { useAppSelector } from "@/redux/typed-hooks";

type Props = {
  flowId: string | null;
  flowVersionId: string | null;
};

export function SaveSimButton({ flowId, flowVersionId }: Props) {
  const [postSim, postState] = usePostSimsMutation();
  const flowSelectedId = useAppSelector((state) => state.sims.flowSelectedId);
  const parentRunId = useAppSelector((state) => state.sims.runSelectedId);
  const reusedSteps = useAppSelector((state) => state.sims.reusedSteps);
  const newSimName = useAppSelector((state) => state.sims.newSimName);

  const handleSave = () => {
    if (
      !flowId ||
      !flowVersionId ||
      !flowSelectedId ||
      !parentRunId ||
      !reusedSteps
    ) {
      return;
    }
    if (!reusedSteps[flowSelectedId]) return;
    if (!newSimName) return;
    if (Object.keys(reusedSteps[flowSelectedId]).length === 0) return;

    const reuse = Object.keys(reusedSteps[flowSelectedId]);
    postSim({ flowId, flowVersionId, parentRunId, reuse, name: newSimName });
  };

  const simId = postState.data?.ok ? postState.data.value.id : null;
  return (
    <div>
      <Button onClick={handleSave} className="mt-2 mb-2 cursor-pointer">
        Save Sim
      </Button>
      {simId ? <p>Saved! Sim Id: {simId}</p> : null}
    </div>
  );
}

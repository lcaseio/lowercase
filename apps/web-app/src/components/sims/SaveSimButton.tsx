import { usePostSimsMutation } from "@/redux/api/sims-api";
import { Button } from "../ui/button";
import { useAppSelector } from "@/redux/typed-hooks";

type Props = {
  flowDefHash: string | null;
};

export function SaveSimButton({ flowDefHash }: Props) {
  const [postSim, postState] = usePostSimsMutation();
  const flowSelectedId = useAppSelector((state) => state.sims.flowSelectedId);
  const parentRunId = useAppSelector((state) => state.sims.runSelectedId);
  const reusedSteps = useAppSelector((state) => state.sims.reusedSteps);
  const newSimName = useAppSelector((state) => state.sims.newSimName);

  const handleSave = () => {
    if (!flowDefHash || !flowSelectedId || !parentRunId || !reusedSteps) return;
    if (!reusedSteps[flowSelectedId]) return;
    if (!newSimName) return;
    if (Object.keys(reusedSteps[flowSelectedId]).length === 0) return;

    const reuse = Object.keys(reusedSteps[flowSelectedId]);
    postSim({ flowDefHash, parentRunId, reuse, name: newSimName });
  };

  const hash = postState.data?.ok ? postState.data.forkSpecHash : null;
  return (
    <div>
      <Button onClick={handleSave} className="mt-2 mb-2 cursor-pointer">
        Save Sim
      </Button>
      {hash ? <p>Saved! ForkSpec Hash: {hash}</p> : null}
    </div>
  );
}

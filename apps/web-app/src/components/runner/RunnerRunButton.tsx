import { useAppDispatch, useAppSelector } from "@/redux/typed-hooks";
import { Button } from "../ui/button";
import { useRequestRunMutation } from "@/redux/api/runs-api";
import { setEventGraphRunId } from "@/redux/slices/runner-slice";

export function RunnerRunButton() {
  const flowSelectedId = useAppSelector((state) => state.runner.flowSelectedId);
  const simSelectedId = useAppSelector((state) => state.runner.simSelectedId);

  const [requestRun] = useRequestRunMutation();
  const dispatch = useAppDispatch();
  const handleRun = async () => {
    if (!flowSelectedId) return;
    const result = await requestRun({
      flowDefHash: flowSelectedId,
      ...(simSelectedId ? { forkSpecHash: simSelectedId } : {}),
    });
    if (result.data?.ok) {
      dispatch(setEventGraphRunId(result.data.runId));
      console.log("event panel id:", result.data.runId);
    }
  };
  return (
    <Button
      className="ml-3 cursor-pointer"
      variant="outline"
      onClick={handleRun}
      disabled={flowSelectedId === null || flowSelectedId === ""}
      style={{}}
    >
      Run
    </Button>
  );
}

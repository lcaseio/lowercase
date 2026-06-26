import { useAppDispatch, useAppSelector } from "@/redux/typed-hooks";
import { Button } from "../ui/button";
import { useRequestRunMutation } from "@/redux/api/runs-api";
import { setEventGraphRunId } from "@/redux/slices/runner-slice";

type Props = {
  params?: Record<string, string>;
  disabled?: boolean;
};

export function RunnerRunButton({ params, disabled = false }: Props) {
  const flowSelectedId = useAppSelector((state) => state.runner.flowSelectedId);
  const simSelectedId = useAppSelector((state) => state.runner.simSelectedId);

  const [requestRun] = useRequestRunMutation();
  const dispatch = useAppDispatch();
  const handleRun = async () => {
    if (!flowSelectedId) return;
    const result = await requestRun({
      flowDefHash: flowSelectedId,
      ...(simSelectedId ? { forkSpecHash: simSelectedId } : {}),
      ...(params && Object.keys(params).length > 0 ? { params } : {}),
    });
    if (result.data?.ok) {
      dispatch(setEventGraphRunId(result.data.runId));
      console.log("event panel id:", result.data.runId);
    }
  };
  return (
    <Button
      className="mt-1 ml-13 cursor-pointer bg-green-200 dark:bg-green-900 w-1/8"
      variant="outline"
      onClick={handleRun}
      disabled={disabled || flowSelectedId === null || flowSelectedId === ""}
      style={{}}
    >
      Run
    </Button>
  );
}

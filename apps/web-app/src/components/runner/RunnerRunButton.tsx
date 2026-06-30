import { useAppDispatch, useAppSelector } from "@/redux/typed-hooks";
import { Button } from "../ui/button";
import { useRequestRunMutation } from "@/redux/api/runs-api";
import { setEventGraphRunId } from "@/redux/slices/runner-slice";

type Props = {
  flowDefHash?: string | null;
  params?: Record<string, string>;
  disabled?: boolean;
};

export function RunnerRunButton({
  flowDefHash,
  params,
  disabled = false,
}: Props) {
  const simSelectedId = useAppSelector((state) => state.runner.simSelectedId);

  const [requestRun] = useRequestRunMutation();
  const dispatch = useAppDispatch();
  const handleRun = async () => {
    if (!flowDefHash) return;
    const result = await requestRun({
      flowDefHash,
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
      disabled={disabled || !flowDefHash}
      style={{}}
    >
      Run
    </Button>
  );
}

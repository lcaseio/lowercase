import { useAppDispatch } from "@/redux/typed-hooks";
import { Button } from "../ui/button";
import { useRequestRunMutation } from "@/redux/api/runs-api";
import { setEventGraphRunId } from "@/redux/slices/runner-slice";

type Props = {
  flowId?: string | null;
  flowVersionId?: string | null;
  flowDefHash?: string | null;
  simId?: string | null;
  forkSpecHash?: string | null;
  params?: Record<string, string>;
  disabled?: boolean;
};

export function RunnerRunButton({
  flowId,
  flowVersionId,
  flowDefHash,
  simId,
  forkSpecHash,
  params,
  disabled = false,
}: Props) {
  const [requestRun] = useRequestRunMutation();
  const dispatch = useAppDispatch();
  const handleRun = async () => {
    if (!flowId || !flowVersionId || !flowDefHash) return;
    const result = await requestRun({
      flowId,
      flowVersionId,
      flowDefHash,
      ...(simId ? { simId } : {}),
      ...(forkSpecHash ? { forkSpecHash } : {}),
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
      disabled={disabled || !flowId || !flowVersionId || !flowDefHash}
      style={{}}
    >
      Run
    </Button>
  );
}

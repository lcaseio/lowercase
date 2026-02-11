import { useAppSelector } from "../redux/typed-hooks";
import { useGetFlowsQuery } from "../redux/api/flows-api";
import { useRequestRunMutation } from "../redux/api/runs-api";
import { useDispatch } from "react-redux";
import {
  setEventGraphRunId,
  setFlowSelectedId,
} from "../redux/slices/runner-slice";
import { Button } from "./ui/button";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export function RunnerFlowSelector() {
  const { data } = useGetFlowsQuery();
  const dispatch = useDispatch();
  // const flowHash = useAppSelector((state) => state.runner.flowHash);
  const [requestRun] = useRequestRunMutation();
  const flowSelectedId = useAppSelector((state) => state.runner.flowSelectedId);

  const handleRun = async () => {
    if (!flowSelectedId || !data?.ok) return;
    const result = await requestRun({ flowDefHash: flowSelectedId });
    if (result.data?.ok) {
      dispatch(setEventGraphRunId(result.data.runId));
      console.log("event panel id:", result.data.runId);
    }
  };
  return (
    <div className="flex cursor-pointer">
      <Select
        onValueChange={(value) => {
          console.log(value);
          dispatch(setFlowSelectedId(value));
        }}
        value={flowSelectedId ?? "Select A Flow"}
      >
        <SelectTrigger className="w-full max-w-100">
          <SelectValue placeholder={flowSelectedId ?? "Select A Flow"} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Select A Flow</SelectLabel>
            {data?.ok === true
              ? data.indexes.map((index) => (
                  <SelectItem value={index.hash} key={index.hash}>
                    {index.name} - {index.version}
                  </SelectItem>
                ))
              : ""}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Button
        className="ml-3 cursor-pointer"
        variant="outline"
        onClick={handleRun}
        disabled={flowSelectedId === null || flowSelectedId === ""}
        style={{}}
      >
        Run
      </Button>
    </div>
  );
}

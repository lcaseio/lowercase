import { useAppSelector } from "../../redux/typed-hooks";
import { useGetFlowsQuery } from "../../redux/api/flows-api";
import { useDispatch } from "react-redux";
import { setRunnerFlowSelectedId } from "../../redux/slices/runner-slice";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export function RunnerFlowSelector() {
  const { data } = useGetFlowsQuery();
  const dispatch = useDispatch();
  // const flowHash = useAppSelector((state) => state.runner.flowHash);

  const flowSelectedId = useAppSelector((state) => state.runner.flowSelectedId);

  return (
    <div className="flex cursor-pointer">
      <Select
        onValueChange={(value) => {
          dispatch(setRunnerFlowSelectedId(value));
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
    </div>
  );
}

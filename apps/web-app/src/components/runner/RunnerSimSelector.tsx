import { useAppSelector } from "../../redux/typed-hooks";
import { useDispatch } from "react-redux";
import { setRunnerSimSelectedId } from "../../redux/slices/runner-slice";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useListAllSimsQuery } from "@/redux/api/sims-api";

export function RunnerSimSelector() {
  const { data } = useListAllSimsQuery();
  const dispatch = useDispatch();
  // const flowHash = useAppSelector((state) => state.runner.flowHash);
  const simSpecSelectedId = useAppSelector(
    (state) => state.runner.simSelectedId,
  );
  const flowSelectedId = useAppSelector((state) => state.runner.flowSelectedId);

  return (
    <div className="flex cursor-pointer">
      <Select
        onValueChange={(value) => {
          dispatch(setRunnerSimSelectedId(value));
        }}
        value={simSpecSelectedId ?? "Select A Flow"}
      >
        <SelectTrigger className="w-full max-w-100">
          <SelectValue placeholder={simSpecSelectedId ?? "Select A Flow"} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Select A Flow</SelectLabel>
            {data?.ok === true
              ? data.forkSpecList
                  .filter(
                    (forkSpecListItem) =>
                      forkSpecListItem.flowDefHash === flowSelectedId,
                  )
                  .map((forkSpecListItem) => (
                    <SelectItem
                      value={forkSpecListItem.forkSpecHash}
                      key={forkSpecListItem.forkSpecHash}
                    >
                      {forkSpecListItem.name}
                    </SelectItem>
                  ))
              : ""}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

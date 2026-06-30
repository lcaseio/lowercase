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
  const flowSelectedId = useAppSelector((state) => state.runner.flowSelectedId);

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 text-md font-medium">Flow:</div>
      <div className="cursor-pointer">
        <Select
          onValueChange={(value) => {
            dispatch(setRunnerFlowSelectedId(value));
          }}
          value={flowSelectedId ?? undefined}
        >
          <SelectTrigger className="w-[26rem] max-w-full">
            <SelectValue placeholder="Select A Flow" />
          </SelectTrigger>
          <SelectContent
            position="popper"
            className="w-[var(--radix-select-trigger-width)]"
          >
            <SelectGroup>
              <SelectLabel>Select A Flow</SelectLabel>
              {data?.ok === true
                ? data.value.map((flowItem) => (
                    <SelectItem value={flowItem.flow.id} key={flowItem.flow.id}>
                      {flowItem.flow.name} -{" "}
                      {flowItem.latestVersion.versionLabel ??
                        `Version ${flowItem.latestVersion.sequence}`}
                    </SelectItem>
                  ))
                : ""}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

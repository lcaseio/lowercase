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

const UNSET_VALUE = "__unset__";

type Props = {
  flowDefHash?: string | null;
};

export function RunnerSimSelector({ flowDefHash }: Props) {
  const { data } = useListAllSimsQuery();
  const dispatch = useDispatch();
  const simSpecSelectedId = useAppSelector(
    (state) => state.runner.simSelectedId,
  );
  const sims =
    data?.ok === true
      ? data.forkSpecList.filter(
          (forkSpecListItem) => forkSpecListItem.flowDefHash === flowDefHash,
        )
      : [];

  if (!flowDefHash || sims.length === 0) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 text-md font-medium">Sim:</div>
      <div className="cursor-pointer">
        <Select
          onValueChange={(value) => {
            dispatch(setRunnerSimSelectedId(value));
          }}
          value={
            simSpecSelectedId &&
            sims.some((sim) => sim.forkSpecHash === simSpecSelectedId)
              ? simSpecSelectedId
              : UNSET_VALUE
          }
        >
          <SelectTrigger className="w-[26rem] max-w-full">
            <SelectValue placeholder="Select A Sim (Optional)" />
          </SelectTrigger>
          <SelectContent
            position="popper"
            className="w-[var(--radix-select-trigger-width)]"
          >
            <SelectGroup>
              <SelectLabel>Select A Sim (Optional)</SelectLabel>
              <SelectItem value={UNSET_VALUE}>None</SelectItem>
              {sims.map((forkSpecListItem) => (
                <SelectItem
                  value={forkSpecListItem.forkSpecHash}
                  key={forkSpecListItem.forkSpecHash}
                >
                  {forkSpecListItem.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

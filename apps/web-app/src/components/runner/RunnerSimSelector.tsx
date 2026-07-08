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
  flowVersionId?: string | null;
};

export function RunnerSimSelector({ flowVersionId }: Props) {
  const { data } = useListAllSimsQuery();
  const dispatch = useDispatch();
  const simSpecSelectedId = useAppSelector(
    (state) => state.runner.simSelectedId,
  );
  const sims =
    data?.ok === true
      ? data.value.filter(
          (simListItem) => simListItem.sim.flowVersionId === flowVersionId,
        )
      : [];

  if (!flowVersionId || sims.length === 0) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 text-md font-medium">Sim:</div>
      <div className="cursor-pointer">
        <Select
          onValueChange={(value) => {
            dispatch(
              setRunnerSimSelectedId(value === UNSET_VALUE ? null : value),
            );
          }}
          value={
            simSpecSelectedId &&
            sims.some((item) => item.sim.id === simSpecSelectedId)
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
              {sims.map((simListItem) => (
                <SelectItem value={simListItem.sim.id} key={simListItem.sim.id}>
                  {simListItem.sim.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

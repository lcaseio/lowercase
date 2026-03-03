import { useListAllRunsQuery } from "@/redux/api/runs-api";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/redux/typed-hooks";
import { setSimsRunSelectedId } from "@/redux/slices/sims-slice";

export function SimsRunSelector({
  flowDefHash,
}: {
  flowDefHash: string | null;
}) {
  const { data } = useListAllRunsQuery();
  const runSelectedId = useAppSelector((state) => state.sims.runSelectedId);
  const dispatch = useDispatch();
  if (data === undefined || data.ok === false) return <p>No runs</p>;

  const sorted = [...data.runList]
    .filter((item) => item.flowDefHash === flowDefHash)
    .sort(
      (a, b) =>
        new Date(b.endTime as string).getTime() -
        new Date(a.endTime as string).getTime(),
    );
  return (
    <div className="flex cursor-pointer">
      <Select
        onValueChange={(value) => {
          dispatch(setSimsRunSelectedId(value));
        }}
        value={runSelectedId ?? "Select A Run"}
      >
        <SelectTrigger className="w-full max-w-100">
          <SelectValue placeholder={runSelectedId ?? "Select A Run"} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Select A Run</SelectLabel>
            {sorted.map((run) => (
              <SelectItem value={run.runId} key={run.runId}>
                {run.startTime}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

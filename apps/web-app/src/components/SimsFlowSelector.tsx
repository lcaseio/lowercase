import { useGetFlowsQuery } from "../redux/api/flows-api";
import { useDispatch } from "react-redux";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { setSimsFlowSelectedId } from "@/redux/slices/sims-slice";

export function SimsFlowSelector({
  selectedFlowId,
}: {
  selectedFlowId: string | null;
}) {
  const { data } = useGetFlowsQuery();
  const dispatch = useDispatch();

  return (
    <div className="flex cursor-pointer">
      <Select
        onValueChange={(value) => {
          console.log(value);
          dispatch(setSimsFlowSelectedId(value));
        }}
        value={selectedFlowId ?? "Select A Flow"}
      >
        <SelectTrigger className="w-full max-w-100">
          <SelectValue placeholder={selectedFlowId ?? "Select A Flow"} />
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

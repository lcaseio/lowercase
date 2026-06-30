import { useGetFlowsQuery } from "../../redux/api/flows-api";
import { useDispatch } from "react-redux";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  setSimsFlowSelectedId,
  setSimsRunSelectedId,
} from "@/redux/slices/sims-slice";

type SimsFlowSelectorProps = {
  selectedFlowId: string | null;
};
export function SimsFlowSelector({ selectedFlowId }: SimsFlowSelectorProps) {
  const { data } = useGetFlowsQuery();
  const dispatch = useDispatch();

  return (
    <div className="flex cursor-pointer">
      <Select
        onValueChange={(value) => {
          console.log(value);
          dispatch(setSimsRunSelectedId(null));
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
  );
}

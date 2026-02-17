import { useListAllSimsQuery } from "@/redux/api/sims-api";
import { SimsListItem } from "./SimsListItem";

export function SimsList() {
  const { data } = useListAllSimsQuery();
  if (!data?.ok) return;

  return (
    <div>
      <h3>Sims List</h3>
      {data.forkSpecList.map((f) => (
        <SimsListItem simsListItem={f} />
      ))}
    </div>
  );
}

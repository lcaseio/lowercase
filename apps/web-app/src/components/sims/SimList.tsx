import { useListAllSimsQuery } from "@/redux/api/sims-api";
import { SimsListItem } from "./SimsListItem";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";

export function SimsList() {
  const { data } = useListAllSimsQuery();

  return (
    <div>
      <p>
        <Button className="mb-2">
          <Link to="/sims/create">Create New</Link>
        </Button>
      </p>
      <h3>Sims List</h3>
      {data?.ok &&
        data.forkSpecList.map((f, i) => (
          <SimsListItem key={f.flowDefName + String(i)} simsListItem={f} />
        ))}
    </div>
  );
}

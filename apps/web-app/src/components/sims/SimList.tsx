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
      <div className="xs:max-w-12/12 sm:max-w-12/12 lg:max-w-5/12 flex flex-col gap-6 mt-4">
        {data?.ok &&
          data.forkSpecList.map((f, i) => (
            <SimsListItem key={f.flowDefName + String(i)} simsListItem={f} />
          ))}
      </div>
    </div>
  );
}

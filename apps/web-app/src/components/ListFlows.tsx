import { useGetFlowsQuery } from "../redux/api/flows-api";
import { FlowListItem } from "./FlowListItem";

export function ListFlows() {
  const { data, error, isLoading } = useGetFlowsQuery();

  if (isLoading) return <div>Loading Flow List...</div>;
  if (data?.ok === false)
    return <div>Error loading Flow List:{JSON.stringify(data.error)}</div>;
  if (error || !data) return <div>Error loading Flow List</div>;

  return (
    <div className="mt-4">
      <h3 className="text-lg font-bold">Flow List</h3>
      <hr className="text-sky-600 text-o mb-6"></hr>
      {data.indexes.map((index) => (
        <FlowListItem key={index.hash} index={index} />
      ))}
    </div>
  );
}

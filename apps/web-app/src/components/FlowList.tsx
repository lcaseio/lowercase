import { useGetFlowsQuery } from "../redux/api/flows-api";
import { FlowListItem } from "./FlowListItem";

export function FlowList() {
  const { data, error, isLoading } = useGetFlowsQuery();

  if (isLoading) return <div>Loading Flow List...</div>;
  if (data?.ok === false)
    return <div>Error loading Flow List:{JSON.stringify(data.error)}</div>;
  if (error || !data) return <div>Error loading Flow List</div>;

  return (
    <div className="mt-4">
      <div className="xs:max-w-12/12 sm:max-w-12/12 lg:max-w-7/12 flex flex-col gap-6 mt-4">
        {data.value.map((flowItem) => (
          <FlowListItem key={flowItem.flow.id} flowItem={flowItem} />
        ))}
      </div>
    </div>
  );
}

import { AddJsonFlow } from "../components/AddJsonFlow";
import { FlowList } from "../components/FlowList";
import { UploadFlowFile } from "../components/UploadFlowFile";

export function Flows() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-5">Flows</h2>
      <FlowList />
      <UploadFlowFile />
      <AddJsonFlow />
    </div>
  );
}

import { AddJsonFlow } from "../components/AddJsonFlow";
import { FlowList } from "../components/FlowList";
import { UploadFlowFile } from "../components/UploadFlowFile";
import { Header } from "../layout/Header";
import { Main } from "../layout/Main";

export function Flows() {
  return (
    <div id="page-wrapper">
      <Header />
      <Main>
        <h2 className="text-xl font-bold mb-5">Flows</h2>
        <FlowList />
        <UploadFlowFile />
        <AddJsonFlow />
      </Main>
    </div>
  );
}

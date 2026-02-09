import { AddJsonFlow } from "../components/AddJsonFlow";
import { ListFlows } from "../components/ListFlows";
import { UploadFlowFile } from "../components/UploadFlowFile";
import { Header } from "../layout/Header";
import { Main } from "../layout/Main";

export function Flows() {
  return (
    <div id="page-wrapper">
      <Header />
      <Main>
        <h2 className="text-xl font-bold mb-5 text-amber-800 dark:text-amber-400">
          Flows
        </h2>
        <ListFlows />
        <UploadFlowFile />
        <AddJsonFlow />
      </Main>
    </div>
  );
}

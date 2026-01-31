import { AddJsonFlow } from "../components/AddJsonFlow";
import { Header } from "../layout/Header";
import { Main } from "../layout/Main";

export function Flows() {
  return (
    <div id="page-wrapper">
      <Header />
      <Main>
        <h2 className="text-lg font-bold">Flows</h2>

        <AddJsonFlow />
      </Main>
    </div>
  );
}

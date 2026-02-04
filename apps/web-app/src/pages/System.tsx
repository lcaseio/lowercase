import { WebSocketPanel } from "../components/WebSocketPanel";
import { Header } from "../layout/Header";
import { Main } from "../layout/Main";

export function System() {
  return (
    <div id="page-wrapper">
      <Header />
      <Main>
        <h2 className="text-xl font-bold mb-5">System</h2>
        <WebSocketPanel />
      </Main>
    </div>
  );
}

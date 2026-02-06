import { EventLog } from "../components/EventLog";
import { RunnerFlowSelector } from "../components/RunnerFlowSelector";
import { Header } from "../layout/Header";
import { Main } from "../layout/Main";

export function Runner() {
  return (
    <div id="page-wrapper">
      <Header />
      <Main>
        <h2 className="text-xl font-bold mb-5">Runner</h2>
        <div className="flex justify-between">
          <RunnerFlowSelector />
          <EventLog />
        </div>
      </Main>
    </div>
  );
}

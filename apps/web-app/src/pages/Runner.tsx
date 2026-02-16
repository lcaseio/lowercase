import { RunnerFlowSelector } from "../components/RunnerFlowSelector";
import { Header } from "../layout/Header";
import { Main } from "../layout/Main";
import { RunDetailsTabs } from "@/components/runs/RunDetailsTabs";

export function Runner() {
  return (
    <div id="page-wrapper">
      <Header />
      <Main>
        <h2 className="text-xl font-bold mb-5">Runner</h2>
        <div className="flex justify-between mb-4">
          <RunnerFlowSelector />
        </div>
        <RunDetailsTabs view="live" />
      </Main>
    </div>
  );
}

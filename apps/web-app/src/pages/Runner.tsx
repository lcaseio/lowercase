import { RunnerFlowSelector } from "../components/runner/RunnerFlowSelector";
import { Header } from "../layout/Header";
import { Main } from "../layout/Main";
import { RunDetailsTabs } from "@/components/runs/RunDetailsTabs";
import { RunnerSimSelector } from "@/components/runner/RunnerSimSelector";
import { RunnerRunButton } from "@/components/runner/RunnerRunButton";

export function Runner() {
  return (
    <div id="page-wrapper">
      <Header />
      <Main>
        <h2 className="text-xl font-bold mb-5">Runner</h2>
        <div className="flex justify-start mb-4">
          <RunnerFlowSelector />
          <RunnerSimSelector />
          <RunnerRunButton />
        </div>
        <RunDetailsTabs view="live" />
      </Main>
    </div>
  );
}

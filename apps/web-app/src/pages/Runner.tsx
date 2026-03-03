import { RunnerFlowSelector } from "../components/runner/RunnerFlowSelector";
import { Header } from "../layout/Header";
import { Main } from "../layout/Main";
import { RunDetailsTabs } from "@/components/runs/RunDetailsTabs";
import { RunnerSimSelector } from "@/components/runner/RunnerSimSelector";
import { RunnerRunButton } from "@/components/runner/RunnerRunButton";
import { useAppDispatch, useAppSelector } from "@/redux/typed-hooks";
import type {
  RunDetailsController,
  Tab,
} from "@/components/runs/use-run-details-controller";
import {
  getEventGraphRunId,
  getRunnerActiveTab,
  getRunnerFlowSelectedId,
  getRunnerSelectedEventId,
  setRunnerActiveTab,
  setRunnerSelectedEventId,
} from "@/redux/slices/runner-slice";
import { RunDetailsControllerProvider } from "@/components/runs/RunDetailsControllerProvider";

export function Runner() {
  const dispatch = useAppDispatch();
  const selectedEventId = useAppSelector(getRunnerSelectedEventId);
  const activeTab = useAppSelector(getRunnerActiveTab);
  const runId = useAppSelector(getEventGraphRunId);
  const flowSelectedId = useAppSelector(getRunnerFlowSelectedId);

  const controller: RunDetailsController = {
    selectedEventId,
    setSelectedEventId: function (id: string | null): void {
      dispatch(setRunnerSelectedEventId(id));
    },
    activeTab,
    setActiveTab: function (tab: Tab): void {
      dispatch(setRunnerActiveTab(tab));
    },
    runId,
    flowDefHash: flowSelectedId,
  };

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

        <RunDetailsControllerProvider value={controller}>
          <RunDetailsTabs view="live" />
        </RunDetailsControllerProvider>
      </Main>
    </div>
  );
}

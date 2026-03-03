import { Header } from "../layout/Header";
import { Main } from "../layout/Main";

import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RunDetailsTabs } from "@/components/runs/RunDetailsTabs";
import { RunDetailsControllerProvider } from "@/components/runs/RunDetailsControllerProvider";
import { useAppDispatch, useAppSelector } from "@/redux/typed-hooks";
import type {
  RunDetailsController,
  Tab,
} from "@/components/runs/use-run-details-controller";

import {
  getRunsActiveTab,
  getRunsSelectedEventId,
  setRunsActiveTab,
  setRunsSelectedEventId,
} from "@/redux/slices/runs-slice";

export function RunDetails() {
  const dispatch = useAppDispatch();
  const selectedEventId = useAppSelector(getRunsSelectedEventId);
  const activeTab = useAppSelector(getRunsActiveTab);
  const { runId, flowDefHash } = useRunDetailsHistoryParams();

  const controller: RunDetailsController = {
    selectedEventId,
    setSelectedEventId: function (id: string | null): void {
      dispatch(setRunsSelectedEventId(id));
    },
    activeTab,
    setActiveTab: function (tab: Tab): void {
      dispatch(setRunsActiveTab(tab));
    },
    runId,
    flowDefHash,
  };
  return (
    <div id="page-wrapper">
      <Header />
      <Main>
        <h2 className="text-xl font-bold mb-5">Run Details</h2>
        <p className="text-sm mb-3">
          <Button variant="link" className="pl-0">
            <Link to="/runs">runs</Link>
          </Button>
          / details
        </p>
        <RunDetailsControllerProvider value={controller}>
          <RunDetailsTabs />
        </RunDetailsControllerProvider>
      </Main>
    </div>
  );
}

function useRunDetailsHistoryParams() {
  const [searchParams] = useSearchParams();
  const runHistoryRunId = searchParams.get("runId");
  const runDetailsFlowDefHash = searchParams.get("flowDefHash");
  return { runId: runHistoryRunId, flowDefHash: runDetailsFlowDefHash };
}

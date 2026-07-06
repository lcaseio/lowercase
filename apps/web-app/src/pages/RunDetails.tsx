import { Header } from "../layout/Header";
import { Main } from "../layout/Main";

import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
import { useGetRunDetailQuery } from "@/redux/api/runs-api";
import { skipToken } from "@reduxjs/toolkit/query";
import { hydrateRunnerFromRun } from "@/redux/slices/runner-slice";

export function RunDetails() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const selectedEventId = useAppSelector(getRunsSelectedEventId);
  const activeTab = useAppSelector(getRunsActiveTab);
  const { runId } = useRunDetailsHistoryParams();
  const runDetailQuery = useGetRunDetailQuery(runId ? { runId } : skipToken);

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
    flowDefHash: null,
  };

  const handleUseParamsInRunner = () => {
    if (runDetailQuery.data?.ok !== true) return;
    const detail = runDetailQuery.data.value;
    if (!detail.run.flowId) return;

    dispatch(
      hydrateRunnerFromRun({
        flowSelectedId: detail.run.flowId,
        selectedParamHashes: Object.fromEntries(
          (detail.params ?? []).map((param) => [param.name, param.artifactHash]),
        ),
      }),
    );
    navigate("/runner");
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
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={handleUseParamsInRunner}
            disabled={runDetailQuery.data?.ok !== true || !runDetailQuery.data.value.run.flowId}
            className="cursor-pointer"
          >
            Use Params In Runner
          </Button>
        </div>
        <RunDetailsControllerProvider value={controller}>
          <RunDetailsTabs view="historical" />
        </RunDetailsControllerProvider>
      </Main>
    </div>
  );
}

function useRunDetailsHistoryParams() {
  const [searchParams] = useSearchParams();
  const runHistoryRunId = searchParams.get("runId");
  return { runId: runHistoryRunId };
}

import { RunnerFlowSelector } from "../components/runner/RunnerFlowSelector";
import { Header } from "../layout/Header";
import { Main } from "../layout/Main";
import { RunDetailsTabs } from "@/components/runs/RunDetailsTabs";
import { RunnerSimSelector } from "@/components/runner/RunnerSimSelector";
import { RunnerRunButton } from "@/components/runner/RunnerRunButton";
import { useAppDispatch, useAppSelector } from "@/redux/typed-hooks";
import { useGetFlowDefQuery, useGetFlowsQuery } from "@/redux/api/flows-api";
import { skipToken } from "@reduxjs/toolkit/query";
import { useEffect, useMemo, useState } from "react";
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
  setRunnerSimSelectedId,
  setRunnerSelectedEventId,
} from "@/redux/slices/runner-slice";
import { RunDetailsControllerProvider } from "@/components/runs/RunDetailsControllerProvider";
import { RunnerParamsPanel } from "@/components/runner/RunnerParamsPanel";

export function Runner() {
  const dispatch = useAppDispatch();
  const selectedEventId = useAppSelector(getRunnerSelectedEventId);
  const activeTab = useAppSelector(getRunnerActiveTab);
  const runId = useAppSelector(getEventGraphRunId);
  const flowSelectedId = useAppSelector(getRunnerFlowSelectedId);
  const { data: flowsData } = useGetFlowsQuery();
  const [selectedParams, setSelectedParams] = useState<Record<string, string>>(
    {},
  );
  const { data: flowDefData, isLoading: isFlowLoading } = useGetFlowDefQuery(
    flowSelectedId ?? skipToken,
  );

  const flowParams =
    flowDefData?.ok === true ? flowDefData.value.params : undefined;

  const selectedFlow = useMemo(() => {
    if (flowsData?.ok !== true || !flowSelectedId) return null;
    return (
      flowsData.value.find((flowItem) => flowItem.flow.id === flowSelectedId) ??
      null
    );
  }, [flowsData, flowSelectedId]);

  const selectedFlowDefHash =
    selectedFlow?.latestVersion.definitionHash ?? flowSelectedId ?? null;

  useEffect(() => {
    setSelectedParams({});
    dispatch(setRunnerSimSelectedId(null));
  }, [flowSelectedId, dispatch]);

  const requiredParamNames = useMemo(() => {
    if (!flowParams) return [];
    return Object.entries(flowParams)
      .filter(([, def]) => def.optional !== true)
      .map(([name]) => name);
  }, [flowParams]);

  const missingRequiredParams = requiredParamNames.filter(
    (name) => !selectedParams[name],
  );
  const runDisabled =
    !flowSelectedId ||
    isFlowLoading ||
    (flowDefData?.ok === true && missingRequiredParams.length > 0);

  const runParams = useMemo(() => {
    const entries = Object.entries(selectedParams).filter(([, hash]) =>
      Boolean(hash),
    );
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }, [selectedParams]);

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
        <div className="flex flex-col gap-3 mb-4">
          <RunnerFlowSelector />
          <RunnerSimSelector flowDefHash={selectedFlowDefHash} />
          <RunnerRunButton
            flowDefHash={selectedFlowDefHash}
            params={runParams}
            disabled={runDisabled}
          />
        </div>

        <div className="mb-6">
          <RunnerParamsPanel
            flowSelectedId={flowSelectedId}
            params={flowParams}
            selectedParams={selectedParams}
            onChange={(name, hash) => {
              setSelectedParams((current) => {
                if (!hash) {
                  const { [name]: _removed, ...rest } = current;
                  return rest;
                }
                return { ...current, [name]: hash };
              });
            }}
          />
          {flowSelectedId &&
          flowDefData?.ok === true &&
          missingRequiredParams.length > 0 ? (
            <p className="mt-2 text-md text-amber-700 dark:text-amber-400">
              Select artifacts for all required params before running this flow.
            </p>
          ) : null}
        </div>

        <RunDetailsControllerProvider value={controller}>
          <RunDetailsTabs view="live" />
        </RunDetailsControllerProvider>
      </Main>
    </div>
  );
}

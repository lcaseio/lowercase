import { RunnerFlowSelector } from "../components/runner/RunnerFlowSelector";
import { Header } from "../layout/Header";
import { Main } from "../layout/Main";
import { RunDetailsTabs } from "@/components/runs/RunDetailsTabs";
import { RunnerSimSelector } from "@/components/runner/RunnerSimSelector";
import { RunnerRunButton } from "@/components/runner/RunnerRunButton";
import { useAppDispatch, useAppSelector } from "@/redux/typed-hooks";
import {
  useGetFlowDefQuery,
  useGetFlowsQuery,
  useGetFlowVersionDefQuery,
} from "@/redux/api/flows-api";
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
import { useListAllSimsQuery } from "@/redux/api/sims-api";

export function Runner() {
  const dispatch = useAppDispatch();
  const selectedEventId = useAppSelector(getRunnerSelectedEventId);
  const activeTab = useAppSelector(getRunnerActiveTab);
  const runId = useAppSelector(getEventGraphRunId);
  const flowSelectedId = useAppSelector(getRunnerFlowSelectedId);
  const simSelectedId = useAppSelector((state) => state.runner.simSelectedId);
  const { data: flowsData } = useGetFlowsQuery();
  const { data: simsData } = useListAllSimsQuery();
  const [selectedParams, setSelectedParams] = useState<Record<string, string>>(
    {},
  );

  const selectedFlow = useMemo(() => {
    if (flowsData?.ok !== true || !flowSelectedId) return null;
    return (
      flowsData.value.find((flowItem) => flowItem.flow.id === flowSelectedId) ??
      null
    );
  }, [flowsData, flowSelectedId]);

  const selectedSim =
    simsData?.ok === true && simSelectedId
      ? simsData.value.find((sim) => sim.sim.id === simSelectedId) ?? null
      : null;

  const { data: latestFlowDefData, isLoading: isLatestFlowLoading } =
    useGetFlowDefQuery(
      selectedSim ? skipToken : flowSelectedId ?? skipToken,
    );
  const { data: simFlowVersionData, isLoading: isSimFlowLoading } =
    useGetFlowVersionDefQuery(selectedSim?.flowVersion.id ?? skipToken);

  const activeFlowDefinition =
    selectedSim && simFlowVersionData?.ok === true
      ? simFlowVersionData.value.definition
      : latestFlowDefData?.ok === true
        ? latestFlowDefData.value
        : undefined;

  const flowParams = activeFlowDefinition?.params;

  const selectedFlowDefHash =
    selectedSim?.flowVersion.definitionHash ??
    selectedFlow?.latestVersion.definitionHash ??
    null;
  const selectedFlowVersionId =
    selectedSim?.flowVersion.id ?? selectedFlow?.latestVersion.id ?? null;

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
    isLatestFlowLoading ||
    isSimFlowLoading ||
    (activeFlowDefinition && missingRequiredParams.length > 0);

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
    flowDefHash: selectedFlowDefHash ?? flowSelectedId,
  };

  return (
    <div id="page-wrapper">
      <Header />
      <Main>
        <h2 className="text-xl font-bold mb-5">Runner</h2>
        <div className="flex flex-col gap-3 mb-4">
          <RunnerFlowSelector />
          <RunnerSimSelector flowVersionId={selectedFlowVersionId} />
          <RunnerRunButton
            flowDefHash={selectedFlowDefHash}
            forkSpecHash={selectedSim?.sim.forkSpecHash ?? null}
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
          activeFlowDefinition &&
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

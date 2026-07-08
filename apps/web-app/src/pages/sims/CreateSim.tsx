import { SaveSimButton } from "@/components/sims/SaveSimButton";
import { SimsFlowSelector } from "@/components/sims/SimsFlowSelector";
import { SimsFlowView } from "@/components/sims/SimsFlowView";
import { SimsNewName } from "@/components/sims/SimsNewName";
import { SimsRunSelector } from "@/components/sims/SimsRunSelector";
import { Header } from "@/layout/Header";
import { Main } from "@/layout/Main";
import { useGetFlowDefQuery, useGetFlowsQuery } from "@/redux/api/flows-api";
import {
  clearReusedSteps,
  setSimsFlowSelectedId,
} from "@/redux/slices/sims-slice";
import { useAppDispatch, useAppSelector } from "@/redux/typed-hooks";
import { skipToken } from "@reduxjs/toolkit/query";
import { useEffect, useMemo } from "react";

export function CreateSim() {
  const selectedFlowId = useAppSelector((state) => state.sims.flowSelectedId);
  const selectedFlowHash = useAppSelector((state) => state.sims.flowDefHash);
  const { data: flowsData } = useGetFlowsQuery();
  const selectedFlow = useMemo(() => {
    if (flowsData?.ok !== true) return null;

    if (selectedFlowId) {
      return (
        flowsData.value.find((flowItem) => flowItem.flow.id === selectedFlowId) ??
        null
      );
    }

    if (selectedFlowHash) {
      return (
        flowsData.value.find(
          (flowItem) => flowItem.latestVersion.definitionHash === selectedFlowHash,
        ) ?? null
      );
    }

    return null;
  }, [flowsData, selectedFlowHash, selectedFlowId]);
  const flowDef = useGetFlowDefQuery(selectedFlow?.flow.id ?? skipToken);
  const selectedFlowDefHash = selectedFlow?.latestVersion.definitionHash ?? null;
  const selectedFlowVersionId = selectedFlow?.latestVersion.id ?? null;
  const dispatch = useAppDispatch();
  dispatch(clearReusedSteps());

  useEffect(() => {
    if (!selectedFlowId && selectedFlow?.flow.id) {
      dispatch(setSimsFlowSelectedId(selectedFlow.flow.id));
    }
  }, [dispatch, selectedFlow, selectedFlowId]);
  return (
    <div id="page-wrapper">
      <Header />
      <Main>
        <h2 className="text-xl font-bold mb-5">Sims</h2>
        <SimsFlowSelector selectedFlowId={selectedFlowId} />
        <SimsRunSelector flowDefHash={selectedFlowDefHash} />
        <SimsNewName />
        <SaveSimButton
          flowId={selectedFlow?.flow.id ?? selectedFlowId}
          flowVersionId={selectedFlowVersionId}
        />
        <SimsFlowView
          flowDef={flowDef.data?.ok ? flowDef.data.value : null}
          isEditable={true}
        />
      </Main>
    </div>
  );
}

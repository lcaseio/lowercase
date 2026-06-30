import { SaveSimButton } from "@/components/sims/SaveSimButton";
import { SimsFlowSelector } from "@/components/sims/SimsFlowSelector";
import { SimsFlowView } from "@/components/sims/SimsFlowView";
import { SimsNewName } from "@/components/sims/SimsNewName";
import { SimsRunSelector } from "@/components/sims/SimsRunSelector";
import { Header } from "@/layout/Header";
import { Main } from "@/layout/Main";
import { useGetFlowDefQuery, useGetFlowsQuery } from "@/redux/api/flows-api";
import { clearReusedSteps } from "@/redux/slices/sims-slice";
import { useAppDispatch, useAppSelector } from "@/redux/typed-hooks";
import { skipToken } from "@reduxjs/toolkit/query";
import { useMemo } from "react";

export function CreateSim() {
  const selectedFlowId = useAppSelector((state) => state.sims.flowSelectedId);
  const { data: flowsData } = useGetFlowsQuery();
  const flowDef = useGetFlowDefQuery(selectedFlowId ?? skipToken);
  const selectedFlow = useMemo(() => {
    if (flowsData?.ok !== true || !selectedFlowId) return null;
    return (
      flowsData.value.find((flowItem) => flowItem.flow.id === selectedFlowId) ??
      null
    );
  }, [flowsData, selectedFlowId]);
  const selectedFlowDefHash = selectedFlow?.latestVersion.definitionHash ?? null;
  const dispatch = useAppDispatch();
  dispatch(clearReusedSteps());
  return (
    <div id="page-wrapper">
      <Header />
      <Main>
        <h2 className="text-xl font-bold mb-5">Sims</h2>
        <SimsFlowSelector selectedFlowId={selectedFlowId} />
        <SimsRunSelector flowDefHash={selectedFlowDefHash} />
        <SimsNewName />
        <SaveSimButton flowDefHash={selectedFlowDefHash} />
        <SimsFlowView
          flowDef={flowDef.data?.ok ? flowDef.data.value : null}
          isEditable={true}
        />
      </Main>
    </div>
  );
}

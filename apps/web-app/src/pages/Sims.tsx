import { SimsList } from "@/components/sims/SimList";
import { SimsFlowSelector } from "@/components/SimsFlowSelector";
import { SimsFlowView } from "@/components/SimsFlowView";
import { Header } from "@/layout/Header";
import { Main } from "@/layout/Main";
import { useGetFlowDefQuery } from "@/redux/api/flows-api";
import { useAppSelector } from "@/redux/typed-hooks";
import { skipToken } from "@reduxjs/toolkit/query";

export function Sims() {
  const selectedFlowId = useAppSelector((state) => state.sims.flowSelectedId);
  const flowDef = useGetFlowDefQuery(selectedFlowId ?? skipToken);

  return (
    <div id="page-wrapper">
      <Header />
      <Main>
        <h2 className="text-xl font-bold mb-5">Sims</h2>
        <SimsFlowSelector selectedFlowId={selectedFlowId} />
        <SimsFlowView flowDef={flowDef.data?.ok ? flowDef.data.value : null} />
        <SimsList />
      </Main>
    </div>
  );
}

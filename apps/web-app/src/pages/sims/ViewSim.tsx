import { SimsFlowView } from "@/components/sims/SimsFlowView";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { Header } from "@/layout/Header";
import { Main } from "@/layout/Main";
import { useGetFlowDefQuery } from "@/redux/api/flows-api";
import { useGetSimSpecQuery } from "@/redux/api/sims-api";
import { setReusedStepIds } from "@/redux/slices/sims-slice";
import { useAppDispatch, useAppSelector } from "@/redux/typed-hooks";
import { skipToken } from "@reduxjs/toolkit/query";
import { useEffect } from "react";
import { Link } from "react-router-dom";

export function ViewSim() {
  const dispatch = useAppDispatch();
  const selectedFlowId = useAppSelector((state) => state.sims.flowSelectedId);
  const simSpecHash = useAppSelector((state) => state.sims.viewedSimSpecHash);
  const flowDef = useGetFlowDefQuery(selectedFlowId ?? skipToken);
  const simSpec = useGetSimSpecQuery(
    simSpecHash ? { hash: simSpecHash } : skipToken,
  );

  useEffect(() => {
    console.log("dispatching reused steps");
    if (!simSpec.data?.ok) return;
    console.log("sim spec data no error");
    if (!selectedFlowId) return;
    console.log("flowId no error");
    dispatch(
      setReusedStepIds({
        flowId: selectedFlowId,
        reused: simSpec.data.spec.reuse,
      }),
    );
  }, [simSpec, selectedFlowId, dispatch]);

  return (
    <div id="page-wrapper">
      <Header />
      <Main>
        <h2 className="text-xl font-bold mb-5">Sims</h2>
        <Breadcrumb className="pt-0">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/sims">Sims</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>View</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <SimsFlowView flowDef={flowDef.data?.ok ? flowDef.data.value : null} />
      </Main>
    </div>
  );
}

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
import { useGetFlowVersionDefQuery } from "@/redux/api/flows-api";
import { useGetSimQuery } from "@/redux/api/sims-api";
import { setReusedStepIds } from "@/redux/slices/sims-slice";
import { useAppDispatch, useAppSelector } from "@/redux/typed-hooks";
import { skipToken } from "@reduxjs/toolkit/query";
import { useEffect } from "react";
import { Link } from "react-router-dom";

export function ViewSim() {
  const dispatch = useAppDispatch();
  const viewedSimId = useAppSelector((state) => state.sims.viewedSimId);
  const simQuery = useGetSimQuery(
    viewedSimId ? { simId: viewedSimId } : skipToken,
  );
  const flowDef = useGetFlowVersionDefQuery(
    simQuery.data?.ok === true ? simQuery.data.value.sim.flowVersionId : skipToken,
  );

  useEffect(() => {
    if (!simQuery.data?.ok) return;
    dispatch(
      setReusedStepIds({
        flowId: simQuery.data.value.sim.flowId,
        reused: simQuery.data.value.spec.reuse,
      }),
    );
  }, [simQuery, dispatch]);

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
        <SimsFlowView
          flowDef={flowDef.data?.ok ? flowDef.data.value.definition : null}
        />
      </Main>
    </div>
  );
}

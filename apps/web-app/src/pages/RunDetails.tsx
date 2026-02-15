import { Header } from "../layout/Header";
import { Main } from "../layout/Main";

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RunDetailsTabs } from "@/components/runs/RunDetailsTabs";
// import { useGetFlowDefQuery } from "@/redux/api/flows-api";
// import { skipToken } from "@reduxjs/toolkit/query";

export function RunDetails() {
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
        <RunDetailsTabs view="historical" />
      </Main>
    </div>
  );
}

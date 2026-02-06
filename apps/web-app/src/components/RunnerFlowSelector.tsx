import { useAppSelector } from "../redux/typed-hooks";
import { useGetFlowDefQuery, useGetFlowsQuery } from "../redux/api/flows-api";
import { useRequestRunMutation } from "../redux/api/runs-api";
import { useDispatch } from "react-redux";
import { setFlowSelectedId } from "../redux/slices/runner-slice";
import { skipToken } from "@reduxjs/toolkit/query";
import { RunnerFlowView } from "./RunnerFlowView";

export function RunnerFlowSelector() {
  const { data } = useGetFlowsQuery();
  const dispatch = useDispatch();
  // const flowHash = useAppSelector((state) => state.runner.flowHash);
  const [requestRun, requestRunState] = useRequestRunMutation();
  const flowSelectedId = useAppSelector((state) => state.runner.flowSelectedId);
  const flowDefQuery = useGetFlowDefQuery(flowSelectedId ?? skipToken);

  const handleRun = async () => {
    if (!flowSelectedId || !data?.ok) return;
    await requestRun({ flowDefHash: flowSelectedId });
  };
  return (
    <div>
      <label className="block">Select A Flow Definition:</label>
      <select
        className="bg-slate-700 p-2 min-w-50 cursor-pointer"
        onChange={(e) => {
          dispatch(setFlowSelectedId(e.target.value));
        }}
        value={flowSelectedId ?? ""}
      >
        <option value="">-- Select a Flow --</option>
        {data?.ok === true
          ? data.indexes.map((index) => (
              <option value={index.hash} key={index.hash}>
                {index.name} - {index.version}
              </option>
            ))
          : ""}
      </select>
      <button
        className="ml-3"
        onClick={handleRun}
        disabled={flowSelectedId === null || flowSelectedId === ""}
      >
        Run
      </button>
      <span>{requestRunState.isLoading ? "loading" : ""}</span>
      {flowDefQuery.data?.ok ? (
        <RunnerFlowView flowDef={flowDefQuery.data.value} />
      ) : (
        ""
      )}
    </div>
  );
}

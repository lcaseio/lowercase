import "./App.css";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { useGetFlowsQuery } from "./redux/api/flows-api";
import { AppShell } from "./layout/AppShell";
import { Dashboard } from "./pages/Dashboard";
import { Flows } from "./pages/Flows";
import { FlowsEdit } from "./pages/FlowsEdit";
import { Runner } from "./pages/Runner";
import { System } from "./pages/System";
import { Runs } from "./pages/Runs";
import { RunDetails } from "./pages/RunDetails";
import { Sims } from "./pages/sims/Sims";
import { CreateSim } from "./pages/sims/CreateSim";
import { ViewSim } from "./pages/sims/ViewSim";
import { Artifacts } from "./pages/Artifacts";
import { Evals } from "./pages/Evals";
import { FlowVersionWorkspace } from "./pages/flow-version/FlowVersionWorkspace";
import { FlowVersionEdit } from "./pages/flow-version/FlowVersionEdit";
import { FlowVersionModePlaceholder } from "./pages/flow-version/FlowVersionModePlaceholder";
import { FlowVersionView } from "./pages/flow-version/FlowVersionView";
import { FlowVersionRun } from "./pages/flow-version/FlowVersionRun";
import { FlowVersionRunHistory } from "./pages/flow-version/FlowVersionRunHistory";
import { FlowVersionSims } from "./pages/flow-version/FlowVersionSims";
import { FlowVersionArtifacts } from "./pages/flow-version/FlowVersionArtifacts";

function SpikeIndexRedirect() {
  const { data, isLoading } = useGetFlowsQuery();

  if (isLoading) return <div className="p-4">Loading flows...</div>;

  const first = data?.ok ? data.value[0] : null;
  if (!first) {
    return (
      <div className="p-4">
        No flows yet.{" "}
        <Link to="/flows" className="underline">
          Create one
        </Link>
        .
      </div>
    );
  }

  return (
    <Navigate
      to={`/spike/${first.flow.id}/${first.latestVersion.id}/edit`}
      replace
    />
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/spike" element={<SpikeIndexRedirect />} />
        <Route
          path="/spike/:flowId/:versionId"
          element={<FlowVersionWorkspace />}
        >
          <Route index element={<Navigate to="edit" replace />} />
          <Route path="edit" element={<FlowVersionEdit />} />
          <Route path="view" element={<FlowVersionView />} />
          <Route path="run" element={<FlowVersionRun />} />
          <Route path="runs" element={<FlowVersionRunHistory />} />
          <Route path="sims" element={<FlowVersionSims />} />
          <Route path="artifacts" element={<FlowVersionArtifacts />} />
          <Route
            path="evals"
            element={<FlowVersionModePlaceholder mode="Evals" />}
          />
        </Route>
        <Route path="/flows" element={<Flows />} />
        <Route path="/flows/edit/:flowId" element={<FlowsEdit />} />
        <Route path="/runner" element={<Runner />} />
        <Route path="/artifacts" element={<Artifacts />} />
        <Route path="/evals" element={<Evals />} />
        <Route path="/system" element={<System />} />
        <Route path="/runs" element={<Runs />} />
        <Route path="/runs/details" element={<RunDetails />} />
        <Route path="/sims" element={<Sims />} />
        <Route path="/sims/create" element={<CreateSim />} />
        <Route path="/sims/view" element={<ViewSim />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}

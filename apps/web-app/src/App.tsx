import "./App.css";
import { Route, Routes } from "react-router-dom";
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

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/flows" element={<Flows />} />
      <Route path="/flows/edit/:flowId" element={<FlowsEdit />} />
      <Route path="/runner" element={<Runner />} />
      <Route path="/system" element={<System />} />
      <Route path="/runs" element={<Runs />} />
      <Route path="/runs/details" element={<RunDetails />} />
      <Route path="/sims" element={<Sims />} />
      <Route path="/sims/create" element={<CreateSim />} />
      <Route path="/sims/view" element={<ViewSim />} />
      <Route path="*" element={<Dashboard />} />
    </Routes>
  );
}

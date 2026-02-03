import "./App.css";
import { Route, Routes } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { Flows } from "./pages/Flows";
import { FlowsEdit } from "./pages/FlowsEdit";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/flows" element={<Flows />} />
      <Route path="/flows/edit/:flowId" element={<FlowsEdit />} />
      {/* <Route path="/sims" element={<Sims />} />
      <Route path="/runs" element={<Runs />} />
      <Route path="/system" element={<System />} />
      <Route path="*" element={<Dashboard />} /> */}
    </Routes>
  );
}

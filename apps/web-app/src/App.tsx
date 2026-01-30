import "./App.css";
import { Route, Routes } from "react-router-dom";
import { Dashboard, Flows, Runs, Sims, System } from "@lcase/ui";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/flows" element={<Flows />} />
      <Route path="/sims" element={<Sims />} />
      <Route path="/runs" element={<Runs />} />
      <Route path="/system" element={<System />} />
      <Route path="*" element={<Dashboard />} />
    </Routes>
  );
}

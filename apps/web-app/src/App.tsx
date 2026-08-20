import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./layout/AppShell";
import { System } from "./pages/System";
import { Evals } from "./pages/Evals";
import { Explorer } from "./pages/Explorer";

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/explorer" replace />} />
        <Route path="/explorer" element={<Explorer />} />
        <Route path="/evals" element={<Evals />} />
        <Route path="/system" element={<System />} />
        <Route path="*" element={<Navigate to="/explorer" replace />} />
      </Route>
    </Routes>
  );
}

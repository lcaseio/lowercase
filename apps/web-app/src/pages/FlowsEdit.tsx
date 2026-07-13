import { FlowEditPanel } from "../components/FlowEditPanel";
import { Link } from "react-router-dom";

export function FlowsEdit() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-5">Flow Editor</h2>
      <p className="text-sm mb-3">
        <Link to="/flows">flows</Link> / edit
      </p>

      <FlowEditPanel />
    </div>
  );
}

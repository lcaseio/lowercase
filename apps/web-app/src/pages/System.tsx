import { ModeToggle } from "@/components/mode-toggle";
import { WebSocketPanel } from "../components/WebSocketPanel";

export function System() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-5">System</h2>
      <WebSocketPanel />

      <ModeToggle />
    </div>
  );
}

import { ThemeToggle } from "@/components/ThemeToggle";
import { WebSocketPanel } from "../components/WebSocketPanel";

export function System() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-5">System</h2>
      <WebSocketPanel />

      <ThemeToggle />
    </div>
  );
}

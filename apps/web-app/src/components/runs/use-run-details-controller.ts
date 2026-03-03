import { createContext, useContext } from "react";

export type Tab =
  | "flow"
  | "events"
  | "details"
  | "artifacts"
  | "artifactViewer";

export type RunDetailsController = {
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  runId: string | null;
  flowDefHash: string | null;
};

export const RunDetailsControllerContext =
  createContext<RunDetailsController | null>(null);

export function useRunDetailsController() {
  const context = useContext(RunDetailsControllerContext);
  if (!context) {
    throw new Error("useRunDetailsController must be used within a provider");
  }
  return context;
}

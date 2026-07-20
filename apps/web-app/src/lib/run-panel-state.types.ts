import type { MainPanelLanguage } from "@/components/MainPanelTypes";

export type FlowVersionRunMainTab = "graph" | "events" | "focused";
export type FlowVersionRunDetailsTab = "eventDetails" | "stepResults";

export type FlowVersionRunFocusedContent = {
  title: string;
  value: string;
  language: MainPanelLanguage;
};

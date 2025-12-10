import type { ToolId } from "../tool/tool.types.js";
export type WorkerMetadata = {
  id: string;
  name: string;
  type: "internal" | "external";
  tools: ToolId[];
};

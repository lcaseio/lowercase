import type { FlowIndex } from "../../flow-index-store/flow-index.js";

export type GetFlowsRes =
  | { ok: true; indexes: FlowIndex[] }
  | { ok: false; error: string };

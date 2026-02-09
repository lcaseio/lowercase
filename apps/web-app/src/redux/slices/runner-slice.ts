import type { FlowDefinition, ForkSpec } from "@lcase/types";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

type RunnerState = {
  flowHash: string | null;
  flowDef: FlowDefinition | null;
  forkSpecHash: string | null;
  forkSpec?: ForkSpec | null;
  flowSelectedId: string | null;
  eventPanels: string[];
};
const initialState: RunnerState = {
  flowHash: null,
  flowDef: null,
  forkSpecHash: null,
  forkSpec: null,
  flowSelectedId: null,
  eventPanels: [],
};

type FlowHash = string;
export const runSlice = createSlice({
  name: "run",
  initialState,
  reducers: {
    setFlowHash: (state, action: PayloadAction<FlowHash | null>) => {
      state.flowHash = action.payload;
    },
    setFlowDef: (state, action: PayloadAction<FlowDefinition | null>) => {
      state.flowDef = action.payload;
    },
    setFlowSelectedId: (state, action: PayloadAction<string | null>) => {
      state.flowSelectedId = action.payload;
    },
    addEventPanel: (state, action: PayloadAction<string>) => {
      state.eventPanels.push(action.payload);
    },
  },
});

export const { setFlowHash, setFlowDef, setFlowSelectedId, addEventPanel } =
  runSlice.actions;
export const selectFlowHash = (state: RootState) => {
  return state.runner.flowHash;
};

export const selectFlows = (state: RootState) => {
  return state.flows.indexes;
};

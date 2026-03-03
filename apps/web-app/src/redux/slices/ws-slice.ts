import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { WsStatus } from "../middleware/ws";

type WsState = WsStatus;
const initialState: WsState = {
  status: "closed",
};
export const wsSlice = createSlice({
  name: "ws",
  initialState,
  reducers: {
    setStatus: (state, action: PayloadAction<WsStatus>) => {
      state.status = action.payload.status;
      state.reason = action.payload.reason;
    },
  },
});

export const { setStatus } = wsSlice.actions;

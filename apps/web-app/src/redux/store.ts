import { configureStore } from "@reduxjs/toolkit";
import { flowsApi } from "./api/flows-api";
import { flowsReducer } from "./slices/flows-slice";

export const store = configureStore({
  reducer: {
    flows: flowsReducer,
    [flowsApi.reducerPath]: flowsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(flowsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;

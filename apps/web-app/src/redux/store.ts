import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { flowsApi } from "./api/flows-api";
import { flowsSlice } from "./slices/flows-slice";
import { routeEventListenerMiddleware } from "./middleware/route-event";
import { createWsMiddleware } from "./middleware/ws";
import { eventsSlice } from "./slices/events-slice";
import { wsSlice } from "./slices/ws-slice";
import { runSlice } from "./slices/runner-slice";
import { runsApi } from "./api/runs-api";
import { simsSlice } from "./slices/sims-slice";

// reducers are separated out to type RootState independently of store,
// because middleware in the store needs RootState.  This avoids circular
// type dependencies
export const rootReducer = combineReducers({
  flows: flowsSlice.reducer,
  events: eventsSlice.reducer,
  ws: wsSlice.reducer,
  runner: runSlice.reducer,
  sims: simsSlice.reducer,
  [flowsApi.reducerPath]: flowsApi.reducer,
  [runsApi.reducerPath]: runsApi.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(routeEventListenerMiddleware.middleware)
      .concat(flowsApi.middleware, runsApi.middleware, createWsMiddleware()),
});

export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;

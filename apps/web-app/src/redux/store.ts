import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { flowsApi } from "./api/flows-api";
import { flowsSlice } from "./slices/flows-slice";
import { routeEventListenerMiddleware } from "./middleware/route-event";
import { createWsMiddleware } from "./middleware/ws";
import { eventsSlice } from "./slices/events-slice";
import { wsSlice } from "./slices/ws-slice";
import { runnerSlice } from "./slices/runner-slice";
import { runsApi } from "./api/runs-api";
import { simsSlice } from "./slices/sims-slice";
import { simsApi } from "./api/sims-api";
import { runsSlice } from "./slices/runs-slice";
import { artifactsApi } from "./api/artifacts-api";
import { evalsApi } from "./api/evals-api";
import { flowVersionRunSlice } from "./slices/flow-version-run-slice";
import { flowVersionRunHistorySlice } from "./slices/flow-version-run-history-slice";
import { flowVersionSimsSlice } from "./slices/flow-version-sims-slice";
import { flowVersionArtifactsSlice } from "./slices/flow-version-artifacts-slice";

// reducers are separated out to type RootState independently of store,
// because middleware in the store needs RootState.  This avoids circular
// type dependencies
export const rootReducer = combineReducers({
  flows: flowsSlice.reducer,
  events: eventsSlice.reducer,
  ws: wsSlice.reducer,
  runner: runnerSlice.reducer,
  sims: simsSlice.reducer,
  runs: runsSlice.reducer,
  flowVersionRun: flowVersionRunSlice.reducer,
  flowVersionRunHistory: flowVersionRunHistorySlice.reducer,
  flowVersionSims: flowVersionSimsSlice.reducer,
  flowVersionArtifacts: flowVersionArtifactsSlice.reducer,
  [flowsApi.reducerPath]: flowsApi.reducer,
  [runsApi.reducerPath]: runsApi.reducer,
  [simsApi.reducerPath]: simsApi.reducer,
  [artifactsApi.reducerPath]: artifactsApi.reducer,
  [evalsApi.reducerPath]: evalsApi.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(routeEventListenerMiddleware.middleware)
      .concat(
        flowsApi.middleware,
        runsApi.middleware,
        simsApi.middleware,
        artifactsApi.middleware,
        evalsApi.middleware,
        createWsMiddleware(),
      ),
});

export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;

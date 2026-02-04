import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { flowsApi } from "./api/flows-api";
import { flowsSlice } from "./slices/flows-slice";
import { routeEventListenerMiddleware } from "./middleware/route-event";
import { createWsMiddleware } from "./middleware/ws";
import { eventsSlice } from "./slices/events-slice";

// reducers are separated out to type RootState independently of store,
// because middleware in the store needs RootState.  This avoids circular
// type dependencies
export const rootReducer = combineReducers({
  flows: flowsSlice.reducer,
  events: eventsSlice.reducer,
  [flowsApi.reducerPath]: flowsApi.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(routeEventListenerMiddleware.middleware)
      .concat(flowsApi.middleware, createWsMiddleware()),
});

export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;

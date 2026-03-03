import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter } from "react-router-dom";

import { App } from "./App";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import { WsBootstrap } from "./ws-bootstrap";
import { ThemeProvider } from "./contexts/theme-provider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider storageKey="vite-ui-theme">
      <Provider store={store}>
        <BrowserRouter>
          <WsBootstrap />
          <App />
        </BrowserRouter>
      </Provider>
    </ThemeProvider>
  </StrictMode>,
);

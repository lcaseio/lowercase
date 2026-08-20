import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter } from "react-router-dom";

import { App } from "./App";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import { SseBootstrap } from "./sse-bootstrap";
import { ThemeProvider } from "./contexts/theme-provider";
import { Toaster } from "./components/ui/sonner";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider storageKey="vite-ui-theme">
      <Provider store={store}>
        <BrowserRouter>
          <SseBootstrap />
          <Toaster />
          <App />
        </BrowserRouter>
      </Provider>
    </ThemeProvider>
  </StrictMode>,
);

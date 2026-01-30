import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { MockApiClient } from "./api/mock-client-controller";
import { BrowserRouter } from "react-router-dom";

import { ControllerProvider } from "@lcase/ui";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ControllerProvider controller={new MockApiClient()}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ControllerProvider>
  </StrictMode>,
);

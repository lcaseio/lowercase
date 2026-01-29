import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { MockApiClient } from "./api/mock-client-controller";
// import App from "./App.tsx";

import { App, ControllerProvider } from "@lcase/ui";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ControllerProvider controller={new MockApiClient()}>
      <App />
    </ControllerProvider>
  </StrictMode>,
);

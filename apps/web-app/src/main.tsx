import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { WebClientApi } from "./api/web-client-api";
import { BrowserRouter } from "react-router-dom";

import { ClientApiProvider } from "@lcase/ui";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClientApiProvider api={new WebClientApi("http://localhost:3000")}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClientApiProvider>
  </StrictMode>,
);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./icons.css";
import App from "./App.tsx";
import { UtilizadorProvider } from "./auth";
import { iniciarLigacaoHost } from "./authContext";

iniciarLigacaoHost();

const root = createRoot(document.getElementById("root")!);
if (import.meta.env.DEV) {
  root.render(
    <StrictMode>
      <UtilizadorProvider>
        <App />
      </UtilizadorProvider>
    </StrictMode>,
  );
} else {
  root.render(
    <UtilizadorProvider>
      <App />
    </UtilizadorProvider>,
  );
}

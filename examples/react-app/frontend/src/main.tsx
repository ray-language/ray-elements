import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@raylang/elements/tokens.css";
import "@raylang/elements/base.css";
import "./app.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

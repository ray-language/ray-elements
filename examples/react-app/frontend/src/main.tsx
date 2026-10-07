import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@ray-ds/elements/tokens.css";
import "@ray-ds/elements/base.css";
import "./app.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

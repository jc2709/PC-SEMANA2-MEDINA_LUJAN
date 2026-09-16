import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../app/globals.css";
import CanvasModelApp from "../src/CanvasModelApp";

const root = document.getElementById("root");
if (!root) throw new Error("No se encontró el contenedor principal de Canvas Model IA.");

createRoot(root).render(
  <StrictMode>
    <CanvasModelApp />
  </StrictMode>,
);

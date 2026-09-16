/* eslint-disable @typescript-eslint/no-require-imports */

const { contextBridge } = require("electron");

const DEFAULT_API_BASE_URL = "https://canvas-model-ia-medina-lujan.vercel.app";
let apiBaseUrl = DEFAULT_API_BASE_URL;
try {
  apiBaseUrl = new URL(process.env.CANVAS_MODEL_IA_API_URL || DEFAULT_API_BASE_URL).origin;
} catch {
  // Keep the production endpoint if a desktop launch variable is malformed.
}

contextBridge.exposeInMainWorld("canvasModelIA", {
  platform: process.platform,
  version: "fase-7",
  apiBaseUrl,
});

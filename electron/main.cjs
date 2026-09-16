/* eslint-disable @typescript-eslint/no-require-imports */

const { app, BrowserWindow } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const isDevelopment = process.env.NODE_ENV === "development";
const verificationOutput = process.env.CANVAS_MODEL_IA_VERIFY_OUTPUT;

if (process.env.CANVAS_MODEL_IA_VERIFY_PROFILE) {
  app.setPath("userData", path.resolve(process.env.CANVAS_MODEL_IA_VERIFY_PROFILE));
}

async function verifyRenderer() {
  const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const nav = [...document.querySelectorAll('nav[aria-label="Navegación principal"] button')];
  if (nav.length < 15) throw new Error(`Faltan módulos: se encontraron ${nav.length}.`);

  const modules = [];
  for (const button of nav) {
    button.click();
    await pause(120);
    const heading = document.querySelector(".app-topbar h1")?.textContent?.trim();
    const content = document.querySelector(".app-content")?.textContent?.trim();
    if (!heading || !content) throw new Error(`El módulo ${button.textContent?.trim()} no se renderizó.`);
    modules.push(button.textContent?.trim());
  }

  const apiBaseUrl = window.canvasModelIA?.apiBaseUrl;
  if (apiBaseUrl !== "https://canvas-model-ia-medina-lujan.vercel.app") {
    throw new Error(`Origen IA inesperado: ${apiBaseUrl ?? "ausente"}`);
  }

  const aiNav = nav.find((button) => button.textContent?.includes("Análisis IA"));
  aiNav.click();
  await pause(150);
  const analyze = [...document.querySelectorAll(".ai-toolbar-actions button")]
    .find((button) => button.textContent?.includes("Analizar AS IS"));
  if (!analyze) throw new Error("No se encontró el botón de análisis IA.");

  let apiStatus = null;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    if (String(args[0]).includes("/api/ai")) apiStatus = response.status;
    return response;
  };
  analyze.click();

  const deadline = Date.now() + 75000;
  while (Date.now() < deadline) {
    const response = document.querySelector(".ai-response-header .mode-tag");
    if (response) {
      return { modules, apiBaseUrl, apiStatus, aiMode: response.textContent?.trim() };
    }
    await pause(300);
  }
  throw new Error("El análisis IA no mostró una respuesta en 75 segundos.");
}

async function runVerification(window) {
  try {
    const result = await window.webContents.executeJavaScript(`(${verifyRenderer.toString()})()`);
    fs.writeFileSync(verificationOutput, JSON.stringify({ ok: true, ...result }), "utf8");
  } catch (error) {
    fs.writeFileSync(verificationOutput, JSON.stringify({ ok: false, error: String(error) }), "utf8");
  } finally {
    app.quit();
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1024,
    minHeight: 720,
    backgroundColor: "#f5f7f5",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const appUrl = process.env.CANVAS_MODEL_IA_URL;
  const localHtml = path.join(__dirname, "../dist/electron/index.html");
  if (verificationOutput) {
    window.webContents.once("did-finish-load", () => { void runVerification(window); });
    window.webContents.once("did-fail-load", (_event, code, description) => {
      fs.writeFileSync(verificationOutput, JSON.stringify({ ok: false, error: `No cargó el HTML (${code}): ${description}` }), "utf8");
      app.quit();
    });
  }
  if (isDevelopment && appUrl) window.loadURL(appUrl);
  else window.loadFile(localHtml);
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });

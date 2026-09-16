/* eslint-disable @typescript-eslint/no-require-imports */

const { app, BrowserWindow } = require("electron");
const path = require("node:path");

const isDevelopment = process.env.NODE_ENV === "development";

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
  if (isDevelopment && appUrl) window.loadURL(appUrl);
  else window.loadFile(path.join(__dirname, "../dist/index.html"));
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });

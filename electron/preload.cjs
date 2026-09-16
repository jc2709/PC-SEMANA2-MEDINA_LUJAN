/* eslint-disable @typescript-eslint/no-require-imports */

const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("canvasModelIA", {
  platform: process.platform,
  version: "fase-1",
});

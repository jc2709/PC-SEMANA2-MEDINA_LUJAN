import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  root: "electron",
  base: "./",
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: "../dist/electron",
    emptyOutDir: true,
    sourcemap: false,
  },
});

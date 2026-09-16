import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "electron",
  base: "./",
  plugins: [react()],
  build: {
    outDir: "../dist/electron",
    emptyOutDir: true,
    sourcemap: false,
  },
});

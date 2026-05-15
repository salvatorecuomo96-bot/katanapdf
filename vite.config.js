import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],
  build: {
    target: "es2020",
    // SSR build goes to dist/server; client build goes to dist/client
    outDir: isSsrBuild ? "dist/server" : "dist/client",
  },
  esbuild: {
    target: "es2020",
  },
  // Tell the preview server to serve from dist/client
  preview: {
    outDir: "dist/client",
  },
}));

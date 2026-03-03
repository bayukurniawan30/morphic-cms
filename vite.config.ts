import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import devServer from "@hono/vite-dev-server";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    devServer({
      entry: "src/api/index.ts",
      exclude: [
        /^\/(src\/pages|src\/lib|src\/components)\/.+/, 
        /.*\.tsx?(\?.*)?$/,
        /.*\.css(\?.*)?$/,
        /^\/node_modules\/.*/,
        /^\/@.+$/,
        /^\/favicon\.ico$/
      ],
      injectClientScript: false, // If true, it might inject twice with Inertia; typically false for Hono + React Vite
    }),
  ],
  build: {
    manifest: true,
    outDir: "dist",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

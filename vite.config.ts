import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import devServer from "@hono/vite-dev-server";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getGitHash = () => {
  try {
    return execSync("git rev-parse --short=5 HEAD").toString().trim();
  } catch (_e) {
    return "unknown";
  }
};

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
      injectClientScript: false,
    }),
  ],
  define: {
    "import.meta.env.VITE_GIT_HASH": JSON.stringify(getGitHash()),
  },
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

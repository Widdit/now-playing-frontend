import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import wasm from "vite-plugin-wasm"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(), tailwindcss(), wasm()],
  assetsInclude: ["**/*.glb"],
  server: {
    proxy: {
      "^/api(/|$)": {
        target: "http://localhost:9863",
        changeOrigin: true,
        ws: true,
      },
      "^/assets(/|$)": {
        target: "http://localhost:9863",
        changeOrigin: true,
      },
    }
  },
  build: {
    assetsDir: "vite-assets",
    sourcemap: false,
  },
});

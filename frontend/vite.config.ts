import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ClaimGuard AI frontend — Vite dev server proxies /api -> FastAPI backend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Backend serves the API under /api, so forward the prefix as-is.
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});

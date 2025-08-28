import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/pages": path.resolve(__dirname, "./src/pages"),
      "@/hooks": path.resolve(__dirname, "./src/hooks"),
      "@/utils": path.resolve(__dirname, "./src/utils"),
      "@/types": path.resolve(__dirname, "./src/types"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
      "@/contexts": path.resolve(__dirname, "./src/contexts"),
      "@/assets": path.resolve(__dirname, "./src/assets"),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      "/api/ai": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/api/payments": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5000,
  },
});

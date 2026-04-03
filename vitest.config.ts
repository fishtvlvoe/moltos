import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

// Vitest 設定 — 用於 Moltos Care Web App 單元測試
export default defineConfig({
  plugins: [react()],
  resolve: {
    // 對應 tsconfig.json 的 paths `@/*` → 根目錄
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    // Phase 1 尚無測試，允許 0 test 正常退出
    passWithNoTests: true,
  },
});

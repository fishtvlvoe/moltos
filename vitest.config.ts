import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Vitest 設定 — 用於 Moltos Care Web App 單元測試
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    // Phase 1 尚無測試，允許 0 test 正常退出
    passWithNoTests: true,
  },
});

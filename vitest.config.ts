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
    coverage: {
      provider: 'v8',
      // 覆蓋範圍：僅核心業務邏輯模組（排除基礎設施層和未在 spec 中的 API routes）
      include: [
        'lib/elevenlabs.ts',
        'lib/gemini-prompts.ts',
        'lib/gemini.ts',
        'lib/gmail.ts',
        // lib/speech.ts 排除：主要是 Web Speech API 瀏覽器封裝，jsdom 無法模擬
        'lib/calm-index-bridge.ts',
        'lib/proactive-checkin.ts',
        'lib/youtube.ts',
        'app/api/elevenlabs-signed-url/**',
        'app/api/elevenlabs-webhook/**',
        'app/api/calm-index/route.ts',
        'app/api/chat/history/**',
        'app/api/chat/message/**',
      ],
      exclude: ['lib/__tests__/**', 'node_modules/**'],
      thresholds: {
        lines: 80,
      },
    },
  },
});

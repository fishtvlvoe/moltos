/**
 * tests/api/chat-route-deleted.test.ts
 *
 * 覆蓋 Spec: ai-provider-cleanup — /api/chat 路由應被刪除
 *
 * Scenario:
 * 1. /api/chat 路由已廢棄（前端 2026-04-09 遷移至 ElevenLabs WebSocket）
 * 2. 嘗試 import route handler 應失敗
 *
 * 紅燈原因：app/api/chat/route.ts 檔案仍存在，尚未刪除
 */

import { describe, it, expect } from 'vitest';

describe('/api/chat route 刪除檢查 — AI Provider Cleanup', () => {
  it('綠燈：app/api/chat/route.ts 已被刪除', () => {
    let routeExists = false;
    let importError: string | null = null;

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
      require('@/app/api/chat/route');
      routeExists = true;
    } catch (err) {
      importError = (err as Error).message;
    }

    // 綠燈：route 已被刪除（import 應失敗）
    expect(routeExists).toBe(false);
    expect(importError).not.toBeNull();
  });
});

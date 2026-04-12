/**
 * tests/api/elevenlabs-call-lifecycle.test.ts
 *
 * 覆蓋 Spec: voice-conversation — Call session lifecycle management
 *
 * Scenarios:
 * 1. Call connects successfully — SDK 建立連線後 UI 轉為 active call 狀態
 * 2. Call ends by user — WebSocket 關閉後 UI 回到 idle 狀態
 * 3. Call drops unexpectedly — 連線中斷後最終回到 idle 狀態並顯示錯誤
 *
 * 因為 lifecycle 是 SDK 狀態 → CallState 的映射（純函式），
 * 測試重點在 mapConversationStatus 的完整狀態機覆蓋。
 */

import { describe, it, expect } from 'vitest';
import { mapConversationStatus } from '@/lib/elevenlabs';
import type { CallState } from '@/types/elevenlabs';

// ─── Call connects successfully ───────────────────────────────────────────────

describe('Call connects successfully — UI 轉為 active call 狀態', () => {
  it('SDK status=connecting → CallState=connecting（連線中）', () => {
    const state: CallState = mapConversationStatus('connecting', false);
    expect(state).toBe('connecting');
  });

  it('SDK status=connected, isSpeaking=false → CallState=listening（AI 在聆聽）', () => {
    const state: CallState = mapConversationStatus('connected', false);
    expect(state).toBe('listening');
  });

  it('SDK status=connected, isSpeaking=true → CallState=speaking（AI 在說話）', () => {
    const state: CallState = mapConversationStatus('connected', true);
    expect(state).toBe('speaking');
  });
});

// ─── Call ends by user ────────────────────────────────────────────────────────

describe('Call ends by user — WebSocket 關閉後 UI 回到 idle', () => {
  it('SDK status=disconnecting → CallState=idle（正在中斷連線視為結束）', () => {
    const state: CallState = mapConversationStatus('disconnecting', false);
    expect(state).toBe('idle');
  });

  it('SDK status=disconnected → CallState=idle（已完全中斷）', () => {
    const state: CallState = mapConversationStatus('disconnected', false);
    expect(state).toBe('idle');
  });

  it('通話結束後 isSpeaking 不影響 idle 狀態', () => {
    // disconnected 時即使 isSpeaking=true 也應回到 idle
    expect(mapConversationStatus('disconnected', true)).toBe('idle');
    expect(mapConversationStatus('disconnecting', true)).toBe('idle');
  });
});

// ─── Call drops unexpectedly ──────────────────────────────────────────────────

describe('Call drops unexpectedly — 連線中斷後回到 idle', () => {
  it('意外斷線 (disconnected) → 最終 CallState=idle', () => {
    // 模擬斷線後 SDK 的狀態轉換路徑
    // connected → disconnecting → disconnected
    const activeState = mapConversationStatus('connected', false);
    expect(activeState).toBe('listening'); // 通話中

    const disconnectingState = mapConversationStatus('disconnecting', false);
    expect(disconnectingState).toBe('idle'); // 斷線中已視為結束

    const disconnectedState = mapConversationStatus('disconnected', false);
    expect(disconnectedState).toBe('idle'); // 最終 idle
  });

  it('連線中斷後不保留 speaking 狀態', () => {
    // AI 說話中 → 突然斷線
    const speakingState = mapConversationStatus('connected', true);
    expect(speakingState).toBe('speaking');

    const afterDropState = mapConversationStatus('disconnected', true);
    expect(afterDropState).toBe('idle'); // 斷線後必須是 idle，不能殘留 speaking
  });
});

// ─── 完整狀態機覆蓋 ───────────────────────────────────────────────────────────

describe('狀態機完整性 — 所有有效狀態均有對應 CallState', () => {
  const allStatusTransitions: Array<{
    status: Parameters<typeof mapConversationStatus>[0];
    isSpeaking: boolean;
    expected: CallState;
  }> = [
    { status: 'connecting',    isSpeaking: false, expected: 'connecting' },
    { status: 'connecting',    isSpeaking: true,  expected: 'connecting' },
    { status: 'connected',     isSpeaking: false, expected: 'listening' },
    { status: 'connected',     isSpeaking: true,  expected: 'speaking' },
    { status: 'disconnecting', isSpeaking: false, expected: 'idle' },
    { status: 'disconnecting', isSpeaking: true,  expected: 'idle' },
    { status: 'disconnected',  isSpeaking: false, expected: 'idle' },
    { status: 'disconnected',  isSpeaking: true,  expected: 'idle' },
  ];

  for (const { status, isSpeaking, expected } of allStatusTransitions) {
    it(`status=${status}, isSpeaking=${isSpeaking} → ${expected}`, () => {
      expect(mapConversationStatus(status, isSpeaking)).toBe(expected);
    });
  }
});

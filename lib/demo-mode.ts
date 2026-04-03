/**
 * Demo 模式工具函式
 *
 * 用途：在 URL 加入 ?demo=true 時，讓前端元件自動改用靜態 demo data，
 * 不需要真實的 Google 登入與 API token。
 *
 * 用法：
 *   import { withDemoParam } from '@/lib/demo-mode';
 *   const res = await fetch(withDemoParam('/api/calm-index'));
 */

/**
 * 判斷目前是否為 Demo 模式
 * Server Side 永遠回傳 false（window 不存在）
 */
export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('demo') === 'true';
}

/**
 * 若為 Demo 模式，在 URL 尾端附加 demo=true 查詢參數
 * 若已有其他查詢參數，用 & 連接；否則用 ? 開頭
 */
export function withDemoParam(url: string): string {
  if (!isDemoMode()) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}demo=true`;
}

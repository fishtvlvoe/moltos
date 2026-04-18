'use client';

/**
 * NotificationBadge — Header 右上角通知紅點
 *
 * 行為：
 *  - 掛載後 60 秒輪詢一次 `/api/notifications?unread=true&count_only=true`
 *  - 未讀 > 0 顯示紅點與數字
 *  - 點擊跳轉 `/notifications`
 *
 * 對應 openspec/changes/notification-delivery-mvp/design.md Decision 8
 * 使用浮動位置（fixed top-right），不影響現有 TabBar layout
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';

const POLL_INTERVAL_MS = 60_000;

export function NotificationBadge() {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    let aborted = false;

    async function fetchCount() {
      try {
        const res = await fetch('/api/notifications?unread=true&count_only=true', {
          cache: 'no-store',
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = (await res.json()) as { count?: number };
        if (!aborted && typeof data.count === 'number') {
          setUnreadCount(data.count);
        }
      } catch {
        // 網路失敗靜默，下一輪再試
      }
    }

    fetchCount();
    const id = setInterval(fetchCount, POLL_INTERVAL_MS);

    return () => {
      aborted = true;
      clearInterval(id);
    };
  }, []);

  return (
    <Link
      href="/notifications"
      aria-label={
        unreadCount > 0 ? `通知（${unreadCount} 則未讀）` : '通知'
      }
      className="fixed top-3 right-3 z-40 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur shadow-sm border border-gray-200 text-gray-700 hover:text-stone-800 hover:bg-white transition-colors"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unreadCount > 0 && (
        <span
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[11px] font-semibold leading-none rounded-full bg-red-500 text-white"
          aria-hidden="true"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}

'use client';

/**
 * /notifications — 站內通知列表頁
 *
 * 行為：
 *  - 掛載後呼叫 GET /api/notifications 取得全部通知
 *  - 倒序渲染；未讀加左側橘色色條 + 粗體
 *  - 點擊未讀項目 → POST /api/notifications/[id]/read，UI 樂觀更新為已讀
 */

import { useCallback, useEffect, useState } from 'react';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  sent_via: string;
  read_at: string | null;
  created_at: string;
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('zh-TW', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      if (!res.ok) {
        setError(`載入失敗（${res.status}）`);
        setLoading(false);
        return;
      }
      const data = (await res.json()) as { notifications?: NotificationItem[] };
      setItems(data.notifications ?? []);
      setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : '載入失敗');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function markAsRead(id: string) {
    // 樂觀更新：先改 UI，再打 API
    const nowIso = new Date().toISOString();
    setItems((prev) =>
      prev.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: nowIso } : n))
    );

    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    } catch {
      // 失敗不回滾（下次 load 會同步）
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-gray-500">載入中⋯</div>;
  }
  if (error) {
    return <div className="py-12 text-center text-red-500">{error}</div>;
  }
  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400">
        <p>目前沒有通知</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-semibold text-stone-800 mb-4">通知</h1>
      <ul className="space-y-2">
        {items.map((n) => {
          const isUnread = !n.read_at;
          return (
            <li
              key={n.id}
              onClick={() => {
                if (isUnread) void markAsRead(n.id);
              }}
              className={`relative p-4 rounded-lg border bg-white transition-colors cursor-pointer ${
                isUnread
                  ? 'border-orange-200 hover:bg-orange-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              {isUnread && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-2 bottom-2 w-1 rounded bg-orange-500"
                />
              )}
              <div className={`${isUnread ? 'font-semibold' : 'font-normal'} text-stone-800`}>
                {n.title}
              </div>
              <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{n.body}</p>
              <div className="text-xs text-gray-400 mt-2">
                {formatRelative(n.created_at)}
                {n.sent_via && <> · {n.sent_via}</>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

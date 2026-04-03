'use client';

// T042: 設定選單卡片 — 通知、提醒、Gmail 整合、資訊來源、隱私與資料
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

// 選單項目型別定義
interface MenuItem {
  icon: string;
  label: string;
  href?: string; // 有 href → 用 Link 導航；無 href → 顯示「即將推出」
}

// 選單項目清單
const menuItems: MenuItem[] = [
  { icon: '🔔', label: '通知設定' },
  { icon: '⏰', label: '提醒排程' },
  { icon: '📧', label: 'Gmail 整合', href: '/settings/gmail' },
  { icon: '📰', label: '資訊來源' },
  { icon: '🔒', label: '隱私與資料' },
];

export function MenuCard() {
  return (
    <Card className="rounded-2xl shadow-sm border-0 bg-white">
      <CardContent className="py-2 px-0">
        {menuItems.map((item, index) => {
          // 共用的內容結構：icon + 文字 + 右箭頭
          const inner = (
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                {/* Emoji icon */}
                <span className="text-lg w-6 text-center">{item.icon}</span>
                <span className="text-gray-700 text-sm font-medium">
                  {item.label}
                </span>
              </div>
              {/* 右側箭頭 */}
              <span className="text-gray-400 text-sm">›</span>
            </div>
          );

          // Gmail 整合：用 next/link 真實導航
          if (item.href) {
            return (
              <Link key={item.label} href={item.href} className="block">
                {inner}
                {/* 分隔線（最後一項不顯示） */}
                {index < menuItems.length - 1 && (
                  <div className="mx-4 h-px bg-gray-100" />
                )}
              </Link>
            );
          }

          // 其他項目：點擊無反應（UI 佔位）
          return (
            <div key={item.label} className="cursor-default opacity-60">
              {inner}
              {/* 分隔線（最後一項不顯示） */}
              {index < menuItems.length - 1 && (
                <div className="mx-4 h-px bg-gray-100" />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

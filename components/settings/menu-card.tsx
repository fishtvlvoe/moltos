'use client';

// T042: 設定選單卡片 — 通知、提醒、Gmail 整合、資訊來源、隱私與資料
import Link from 'next/link';
import { Bell, Clock, Mail, Newspaper, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// 選單項目型別定義
interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href?: string; // 有 href → 用 Link 導航；無 href → 顯示「即將推出」
}

// 選單項目清單
const menuItems: MenuItem[] = [
  { icon: <Bell className="w-6 h-6" />, label: '通知設定', href: '/settings/notifications' },
  { icon: <Clock className="w-6 h-6" />, label: '提醒排程', href: '/settings/reminders' },
  { icon: <Mail className="w-6 h-6" />, label: 'Gmail 整合', href: '/settings/gmail' },
  { icon: <Newspaper className="w-6 h-6" />, label: '資訊來源', href: '/settings/sources' },
  { icon: <Lock className="w-6 h-6" />, label: '隱私與資料', href: '/settings/privacy' },
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
                {/* SVG icon — 24px，顏色為文字色 */}
                <div className="text-gray-700">{item.icon}</div>
                <span className="text-gray-700 text-sm font-medium">
                  {item.label}
                </span>
              </div>
              {/* 右側箭頭 */}
              <span className="text-gray-400 text-sm">›</span>
            </div>
          );

          // 所有項目都有 href，用 next/link 導航
          // touch target: 最小 44×44px (py-3.5 ≈ 56px height)
          return (
            <Link
              key={item.label}
              href={item.href!}
              className="block hover:bg-gray-50 transition-colors active:bg-gray-100"
              data-testid={`menu-item-${item.label}`}
            >
              {inner}
              {/* 分隔線（最後一項不顯示） */}
              {index < menuItems.length - 1 && (
                <div className="mx-4 h-px bg-gray-100" />
              )}
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

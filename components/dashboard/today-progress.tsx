// T026 — 今日進度卡片
// 靜態假資料 placeholder，顯示當日三項關鍵通訊行為摘要
// 純展示元件，不使用 hooks，不需要 'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ─── 進度項目型別 ─────────────────────────────────────────────────────────────
interface ProgressItem {
  /** Unicode emoji icon */
  icon: string;
  /** 項目標籤文字 */
  label: string;
  /** 顯示數值（字串，含單位） */
  value: string;
}

// ─── 靜態假資料（MVP placeholder，日後由 API 取代） ──────────────────────────
const PROGRESS_ITEMS: ProgressItem[] = [
  {
    icon: '📧',
    label: '已處理郵件',
    value: '12 封',
  },
  {
    icon: '⏰',
    label: '平均回覆時間',
    value: '2.5 小時',
  },
  {
    icon: '🌙',
    label: '深夜活動',
    value: '15 分鐘',
  },
];

// ─── 單行進度項目元件 ─────────────────────────────────────────────────────────
function ProgressRow({ icon, label, value }: ProgressItem) {
  return (
    <div className="flex items-center justify-between py-2">
      {/* 左側：icon + 標籤 */}
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
          style={{ backgroundColor: '#F0EBE4' }}
          aria-hidden="true"
        >
          {icon}
        </span>
        <span className="text-sm text-[#5A5A5A]">{label}</span>
      </div>
      {/* 右側：數值 */}
      <span
        className="text-sm font-semibold"
        style={{ color: '#C67A52' }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── 主元件 ──────────────────────────────────────────────────────────────────
export function TodayProgress() {
  return (
    <Card className="rounded-2xl bg-[#FAF8F4] ring-1 ring-[#EDE8E0]">
      <CardHeader className="pb-0">
        <CardTitle className="text-[#2D2D2D]">今日進度</CardTitle>
        {/* 副標題說明這是 placeholder */}
        <p className="text-xs text-[#8A8A8A]">今天的通訊行為摘要</p>
      </CardHeader>

      <CardContent>
        {/* 進度清單 — 相鄰項目間加分隔線 */}
        <ul className="divide-y divide-[#EDE8E0]" role="list">
          {PROGRESS_ITEMS.map((item) => (
            <li key={item.label}>
              <ProgressRow {...item} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default TodayProgress;

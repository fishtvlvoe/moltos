// T050 — 健康追蹤卡片
// 靜態假資料，展示三項日常健康指標：步數、睡眠、飲水
// 純展示元件，不使用 hooks，不需要 'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Footprints, Moon, Droplet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── 健康指標型別 ─────────────────────────────────────────────────────────────
interface WellnessItem {
  /** Lucide icon component */
  icon: LucideIcon;
  /** 指標標籤 */
  label: string;
  /** 目前數值（字串，含單位） */
  value: string;
  /** 目前值佔目標的百分比（0–100） */
  percentage: number;
  /** 目標說明（顯示在進度條右側） */
  goal: string;
}

// ─── 靜態假資料（MVP placeholder，日後可接穿戴裝置 API）────────────────────
const WELLNESS_ITEMS: WellnessItem[] = [
  {
    icon: Footprints,
    label: '步數',
    value: '6,234 步',
    percentage: 62,   // 目標 10,000 步，6,234 / 10,000 ≈ 62%
    goal: '10,000 步',
  },
  {
    icon: Moon,
    label: '睡眠',
    value: '7.2 小時',
    percentage: 90,   // 目標 8 小時，7.2 / 8 = 90%
    goal: '8 小時',
  },
  {
    icon: Droplet,
    label: '飲水',
    value: '1,200 ml',
    percentage: 60,   // 目標 2,000 ml，1,200 / 2,000 = 60%
    goal: '2,000 ml',
  },
];

// 強調色（與其他卡片一致）
const ACCENT_COLOR = '#C67A52';

// ─── 單行健康指標元件 ─────────────────────────────────────────────────────────
function WellnessRow({ icon: IconComponent, label, value, percentage, goal }: WellnessItem) {
  return (
    <div className="flex flex-col gap-2 py-2">
      {/* 上方：icon + 標籤 / 數值 + 目標 */}
      <div className="flex items-center justify-between">
        {/* 左側：icon + 標籤 */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ backgroundColor: '#F0EBE4' }}
          >
            <IconComponent
              className="h-5 w-5"
              style={{ color: '#8A8A8A' }}
              aria-hidden="true"
            />
          </div>
          <span className="text-sm text-[#5A5A5A]">{label}</span>
        </div>

        {/* 右側：目前數值 */}
        <span
          className="text-sm font-semibold"
          style={{ color: ACCENT_COLOR }}
        >
          {value}
        </span>
      </div>

      {/* 進度條 */}
      <div className="flex items-center gap-2">
        {/* 進度軌道 */}
        <div className="h-2 flex-1 rounded-full bg-[#EDE8E0]">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, percentage)}%`,
              backgroundColor: ACCENT_COLOR,
            }}
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${label} 進度 ${percentage}%`}
          />
        </div>
        {/* 目標說明（右側小字） */}
        <span className="w-20 text-right text-xs text-[#8A8A8A]">
          目標 {goal}
        </span>
      </div>
    </div>
  );
}

// ─── 主元件 ──────────────────────────────────────────────────────────────────
export function WellnessCard() {
  return (
    <Card className="rounded-2xl bg-[#FAF8F4] ring-1 ring-[#EDE8E0]">
      <CardHeader className="pb-0">
        <CardTitle className="text-[#2D2D2D]">健康追蹤</CardTitle>
        {/* 副標題說明為靜態 placeholder */}
        <p className="text-xs text-[#8A8A8A]">今日健康指標概覽</p>
      </CardHeader>

      <CardContent>
        {/* 健康指標清單，相鄰項目間加分隔線 */}
        <ul className="divide-y divide-[#EDE8E0]" role="list">
          {WELLNESS_ITEMS.map((item) => (
            <li key={item.label}>
              <WellnessRow {...item} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default WellnessCard;

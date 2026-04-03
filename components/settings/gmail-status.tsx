'use client';

// T044: Gmail 連接狀態元件 — 顯示連接信息 + 自動分類 toggle（純 UI）
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface GmailStatusProps {
  email?: string | null;
}

export function GmailStatus({ email }: GmailStatusProps) {
  // 自動分類 toggle 狀態（純 UI，尚未接後端）
  const [autoClassify, setAutoClassify] = useState(true);

  return (
    <Card className="rounded-2xl shadow-sm border-0 bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-gray-800">Gmail 連接狀態</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* 連接狀態列 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">連接狀態</span>
          <span className="text-sm font-medium text-green-600">已連接 ✓</span>
        </div>

        {/* 連接的 email 地址 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">帳號</span>
          <span className="text-sm text-gray-700 font-medium">
            {email ?? '—'}
          </span>
        </div>

        {/* 分隔線 */}
        <div className="h-px bg-gray-100" />

        {/* 同步頻率（靜態文字） */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">同步頻率</span>
          <span className="text-sm text-gray-700">每次開啟 App</span>
        </div>

        {/* 郵件分析範圍（靜態文字） */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">分析範圍</span>
          <span className="text-sm text-gray-700">最近 14 天</span>
        </div>

        {/* 分隔線 */}
        <div className="h-px bg-gray-100" />

        {/* 自動分類 toggle（純 UI） */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700 font-medium">自動分類</p>
            <p className="text-xs text-gray-400 mt-0.5">
              依信件內容自動歸類壓力事件
            </p>
          </div>
          {/* 自訂 toggle 開關（不安裝額外 library） */}
          <button
            role="switch"
            aria-checked={autoClassify}
            onClick={() => setAutoClassify((prev) => !prev)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              autoClassify ? 'bg-[#C67A52]' : 'bg-gray-300'
            }`}
          >
            {/* 滑動圓鈕 */}
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                autoClassify ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

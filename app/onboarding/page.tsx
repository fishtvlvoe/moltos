'use client';

// T015: 歡迎頁面 — 純靜態展示 + Google OAuth 登入入口
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';

// 三大功能特色卡片資料
const features = [
  {
    icon: (
      // 平靜指數 — 心跳波形圖示
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: '平靜指數',
    description: '透過 Gmail 分析你的數位壓力，量化每日的情緒負擔',
  },
  {
    icon: (
      // AI 對話 — 對話泡泡圖示
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: 'AI 對話',
    description: '溫暖的 AI 照護助理陪你聊聊，傾聽你今天的感受',
  },
  {
    icon: (
      // 今日摘要 — 播放清單圖示
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <polygon points="10,14 10,18 14,16" fill="currentColor" stroke="none" />
      </svg>
    ),
    title: '今日摘要',
    description: 'YouTube 訂閱頻道的精選內容，為你濾除資訊噪音',
  },
];

export default function OnboardingPage() {
  return (
    // 全螢幕垂直居中，背景 cream
    <div className="flex flex-col min-h-screen px-6 py-12">
      {/* Logo 區域 */}
      <div className="flex flex-col items-center mb-10 mt-8">
        <span
          className="text-3xl font-semibold tracking-[0.2em] mb-3"
          style={{ color: '#C67A52' }}
        >
          MOLTOS
        </span>
        {/* 品牌標語 */}
        <p className="text-center text-gray-600 text-base leading-relaxed max-w-xs">
          把生活的噪音，<br />變成你內心的聲音。
        </p>
      </div>

      {/* 三大功能介紹卡片 */}
      <div className="flex flex-col gap-4 mb-10">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex items-start gap-4 bg-white rounded-2xl p-4 shadow-sm"
          >
            {/* 功能圖示，使用 terracotta 色 */}
            <div
              className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl"
              style={{ backgroundColor: '#FDF0E8', color: '#C67A52' }}
            >
              {feature.icon}
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="font-semibold text-gray-800 text-sm mb-0.5">
                {feature.title}
              </h3>
              <p className="text-gray-500 text-xs leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA 按鈕區域 */}
      <div className="flex flex-col items-center gap-4 mt-auto pb-8">
        {/* 主要 CTA：Google 登入，terracotta 色 */}
        <Button
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          className="w-full h-12 text-base font-medium rounded-2xl text-white"
          style={{ backgroundColor: '#C67A52' }}
        >
          開始使用
        </Button>

        {/* 已有帳號登入的次要連結 */}
        <button
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          已有帳號？登入
        </button>
      </div>
    </div>
  );
}

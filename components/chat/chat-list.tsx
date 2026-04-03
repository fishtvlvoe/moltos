'use client';

import { useRef, useEffect } from 'react';
import type { ChatMessage } from '@/lib/types';
import { MessageBubble } from './message-bubble';

interface ChatListProps {
  messages: ChatMessage[];
}

/**
 * 訊息列表容器元件
 *
 * - 可滾動區域，佔滿剩餘空間（flex-1 overflow-y-auto）
 * - 每次 messages 變化時自動捲動到最新訊息
 * - 空狀態顯示歡迎訊息
 * - 使用 MessageBubble 渲染每條訊息
 */
export function ChatList({ messages }: ChatListProps) {
  // 用於滾動定位的底部錨點參照
  const bottomRef = useRef<HTMLDivElement>(null);

  // 每次訊息更新時，平滑捲動到最底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {messages.length === 0 ? (
        /* 空狀態：顯示歡迎訊息 */
        <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
          {/* 品牌 icon */}
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white"
            style={{ backgroundColor: '#C67A52' }}
            aria-hidden="true"
          >
            M
          </div>

          <p className="text-stone-500 text-sm leading-relaxed">
            你好，有什麼想聊的嗎？
          </p>

          <p className="text-stone-400 text-xs">
            我是 Moltos AI，可以幫你整理、分析生活節奏
          </p>
        </div>
      ) : (
        /* 訊息列表 */
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>
      )}

      {/* 底部錨點，用於自動捲動定位 */}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}

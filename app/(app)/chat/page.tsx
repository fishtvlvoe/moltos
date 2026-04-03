'use client';

// T035: Chat 頁面 — 整合 ChatList + ChatInput，進入時觸發 AI 問候
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ChatList } from '@/components/chat/chat-list';
import { ChatInput } from '@/components/chat/chat-input';
import type { ChatMessage } from '@/lib/types';

export default function ChatPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const greetingSent = useRef(false);

  // 進入頁面時觸發 AI 主動問候
  useEffect(() => {
    if (greetingSent.current || !session?.user?.name) return;
    greetingSent.current = true;

    const greetingMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };
    setMessages([greetingMsg]);
    setIsStreaming(true);

    // 用一般對話 API 發送問候請求
    fetchStream(
      `請用溫暖的語氣跟「${session.user.name}」打招呼，簡短一句話就好，並根據現在的時間問候。`,
      [],
      greetingMsg.id,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.name]);

  // 串流讀取 API 回應
  async function fetchStream(
    message: string,
    history: ChatMessage[],
    assistantMsgId: string,
  ) {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`API 回應錯誤：${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulated += decoder.decode(value, { stream: true });
        // 更新 assistant 訊息內容
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: accumulated }
              : m,
          ),
        );
      }

      // 串流結束，移除 streaming 標記
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, isStreaming: false }
            : m,
        ),
      );
    } catch (error) {
      // 錯誤處理：顯示錯誤訊息
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: '抱歉，目前無法回應，請稍後再試。',
                isStreaming: false,
              }
            : m,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  }

  // 使用者送出訊息
  function handleSend(text: string) {
    // 加入使用者訊息
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    // 建立 assistant 空訊息（等待串流填入）
    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    const updatedMessages = [...messages, userMsg, assistantMsg];
    setMessages(updatedMessages);
    setIsStreaming(true);

    // 發送到 API（history 不含當前的空 assistant 訊息）
    fetchStream(text, [...messages, userMsg], assistantMsg.id);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] -mx-4 -mt-4">
      {/* 頂部標題列 */}
      <header className="flex items-center justify-center py-3 border-b border-[#EDE8E0] bg-white/80 backdrop-blur-sm">
        <h1 className="text-base font-semibold text-[#2D2D2D]">AI 對話</h1>
      </header>

      {/* 訊息列表 — 佔滿剩餘空間 */}
      <ChatList messages={messages} />

      {/* 底部輸入框 */}
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}

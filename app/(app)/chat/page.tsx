'use client';

// T035: Chat 頁面 — 整合 ElevenLabs WebSocket（純文字模式，不開麥克風）
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useConversation } from '@11labs/react';
import { ChatList } from '@/components/chat/chat-list';
import { ChatInput } from '@/components/chat/chat-input';
import { speak } from '@/lib/speech';
import { stripEmotionTags } from '@/lib/elevenlabs';
import type { ChatMessage } from '@/lib/types';
import type { MessagePayload } from '@elevenlabs/types';

export default function ChatPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const initDone = useRef(false);
  // 待連線後送出的訊息佇列
  const pendingMessageRef = useRef<string | null>(null);

  // ─── ElevenLabs SDK（純文字模式，不開麥克風）────────────────────────────────
  const conversation = useConversation({
    onConnect: ({ conversationId }: { conversationId: string }) => {
      console.info('[ElevenLabs Chat] 連線建立，conversation_id:', conversationId);
      setIsConnected(true);
      setIsConnecting(false);

      // 若有待送訊息，連線後立即送出
      if (pendingMessageRef.current) {
        const text = pendingMessageRef.current;
        pendingMessageRef.current = null;
        conversation.sendUserMessage(text);
      }
    },
    onDisconnect: () => {
      console.info('[ElevenLabs Chat] 連線已中斷');
      setIsConnected(false);
      setIsConnecting(false);
    },
    onError: (message: string, context?: unknown) => {
      console.error('[ElevenLabs Chat] 錯誤:', message, context);
      setIsConnected(false);
      setIsConnecting(false);
    },
    onMessage: (props: MessagePayload) => {
      console.log('[ElevenLabs Chat] 收到訊息:', props);
      // 只處理 AI 回應（role 為 'assistant' 或 source 為 'ai'）
      if (props.role === 'agent' || props.source === 'ai') {
        // 過濾情緒標籤（如 [幸福]、[緊張]），避免 TTS 念出來
        const cleanContent = stripEmotionTags(props.message ?? '');
        if (!cleanContent) return;

        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: cleanContent,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        // 非同步存入 DB（非關鍵路徑，失敗不阻斷，但需 log）
        fetch('/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'assistant', content: cleanContent }),
        }).catch((err) => console.warn('[Chat] 存 AI 訊息失敗：', err));

        // TTS 開啟時，自動朗讀 AI 回應（用已過濾標籤的內容）
        if (ttsEnabled && cleanContent) {
          speak(cleanContent).catch(() => {});
        }
      }
    },
  });

  // ─── 連線到 ElevenLabs Agent ─────────────────────────────────────────────────
  const connectToAgent = useCallback(async () => {
    if (isConnecting || isConnected) return;
    setIsConnecting(true);

    try {
      const res = await fetch('/api/elevenlabs-signed-url');
      // 問題 3：先檢查 res.ok，API 掛掉時拋出明確錯誤
      if (!res.ok) throw new Error(`signed-url API 錯誤：${res.status}`);
      const { signedUrl } = await res.json();
      if (!signedUrl) throw new Error('無法取得 signed URL');

      // 問題 1：googleId 不存在就不連線，避免 user_id 傳空字串
      const googleId = (session?.user as { id?: string })?.id;
      if (!googleId) {
        console.warn('[ElevenLabs] 無法取得 Google ID，取消連線');
        setIsConnecting(false);
        return;
      }

      // 取最近 20 筆歷史，格式化後傳入 dynamicVariables，讓 Agent 有記憶上下文
      const recentMessages = messages.slice(-20);
      const historyText = recentMessages.length > 0
        ? recentMessages.map(m => `${m.role === 'user' ? '用戶' : '小默'}：${m.content}`).join('\n')
        : '（尚無歷史對話）';

      await conversation.startSession({
        signedUrl,
        textOnly: true,  // Chat 頁面純文字模式，無需麥克風
        dynamicVariables: {
          user_id: googleId,  // 已確認非空，不用 ?? ''
          conversation_history: historyText,
        },
        overrides: {
          agent: {
            language: 'zh',
          },
        },
      });
    } catch (error) {
      console.error('[ElevenLabs Chat] 連線失敗:', error);
      setIsConnecting(false);
      setIsConnected(false);
    }
  }, [conversation, isConnecting, isConnected, messages, session]);

  // 輪詢 DB，直到筆數增加或超時（20 次，總計 ~60 秒）
  async function pollForNewMessages(previousCount: number) {
    // Fix 4: 漸進退避擴展至 20 次，確保等待 webhook 延遲
    // 模式：1.5s × 2 → 2s × 2 → 3s × 2 → 4s × 2 → 5s × 2 → 5s × 10
    // 共 20 次，上限 ~60-70 秒
    const intervals = [
      1500, 1500,  // 1-2
      2000, 2000,  // 3-4
      3000, 3000,  // 5-6
      4000, 4000,  // 7-8
      5000, 5000,  // 9-10
      5000, 5000,  // 11-12
      5000, 5000,  // 13-14
      5000, 5000,  // 15-16
      5000, 5000,  // 17-18
      5000, 5000,  // 19-20
    ];
    let attempts = 0;

    const poll = async () => {
      if (attempts >= intervals.length) return;
      attempts++;

      try {
        const res = await fetch('/api/chat/history');
        if (res.ok) {
          const history: ChatMessage[] = await res.json();
          if (history.length > previousCount) {
            // 有新資料，更新畫面並停止輪詢
            const cleanedHistory = history.map((m) =>
              m.role === 'assistant' ? { ...m, content: stripEmotionTags(m.content ?? '') } : m,
            );
            setMessages(cleanedHistory);
            return;
          }
        }
      } catch {}

      // 還沒有新資料，依漸進退避間隔再試
      const delay = intervals[attempts - 1] ?? 5000;
      setTimeout(poll, delay);
    };

    // 第一次等 1.5 秒再開始，讓 webhook 有時間寫入
    setTimeout(poll, 1500);
  }

  // 進入頁面時：載入 DB 歷史 → 觸發問候
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    async function init() {
      const fromCall = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('from') === 'call';

      // 從 DB 載入歷史對話（含語音通話紀錄）
      try {
        const res = await fetch('/api/chat/history');
        if (res.ok) {
          const history: ChatMessage[] = await res.json();
          if (history.length > 0) {
            const cleanedHistory = history.map((m) =>
              m.role === 'assistant' ? { ...m, content: stripEmotionTags(m.content ?? '') } : m,
            );
            setMessages(cleanedHistory);
            // 如果是從 Call 跳轉來的，繼續輪詢等待新的通話紀錄
            if (fromCall) {
              pollForNewMessages(history.length);
            }
            return;
          }
        }
      } catch {}

      // 無歷史且從 Call 跳轉來 → 輪詢等待 webhook 寫入
      if (fromCall) {
        pollForNewMessages(0);
        return;
      }

      // 無任何紀錄且有用戶名 → 先連線，Agent 會自動問候
      if (!session?.user?.name) return;
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.name]);

  // ─── 使用者送出訊息 ───────────────────────────────────────────────────────────
  function handleSend(text: string) {
    // 加入使用者訊息到畫面
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // 非同步存入 DB（非關鍵路徑，失敗不阻斷，但需 log）
    // 問題 2：catch 空函式改為記錄 warning，方便 debug
    fetch('/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'user', content: text }),
    }).catch((err) => console.warn('[Chat] 存用戶訊息失敗：', err));

    if (isConnected) {
      // 已連線：直接送出（用自家維護的 isConnected，避免 SDK status 同步延遲）
      conversation.sendUserMessage(text);
    } else {
      // 未連線：暫存訊息，連線後自動送出
      pendingMessageRef.current = text;
      connectToAgent();
    }
  }

  const isStreaming = isConnecting;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] -mx-4 -mt-4">
      {/* 頂部標題列 */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#EDE8E0] bg-white/80 backdrop-blur-sm">
        {/* 語音通話按鈕 */}
        <button
          onClick={() => router.push('/call')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-[#4CAF50] hover:bg-green-50 transition-colors"
          aria-label="語音通話"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span>通話</span>
        </button>
        <h1 className="text-base font-semibold text-[#2D2D2D]">小莫</h1>
        {/* TTS 語音朗讀開關 — 帶文字標籤 */}
        <button
          onClick={() => setTtsEnabled((v) => !v)}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
            ttsEnabled
              ? 'text-[#7C5CBA] bg-[#F0EBFA]'
              : 'text-[#B0B0B0] hover:text-[#8A8A8A]'
          }`}
          aria-label={ttsEnabled ? '關閉語音朗讀' : '開啟語音朗讀'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            {ttsEnabled && (
              <>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </>
            )}
          </svg>
          <span>{ttsEnabled ? '朗讀開' : '朗讀'}</span>
        </button>
      </header>

      {/* 訊息列表 — 佔滿剩餘空間 */}
      <ChatList messages={messages} />

      {/* 底部輸入框 */}
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}

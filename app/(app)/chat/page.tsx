'use client';

// T035: Chat 頁面 — 整合 ElevenLabs WebSocket（純文字模式，不開麥克風）
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useConversation } from '@11labs/react';
import { ChatList } from '@/components/chat/chat-list';
import { ChatInput } from '@/components/chat/chat-input';
import { speak } from '@/lib/speech';
import type { ChatMessage } from '@/lib/types';
import type { MessagePayload } from '@elevenlabs/types';

export default function ChatPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [insight, setInsight] = useState<any>(null);
  const [analyzingInsight, setAnalyzingInsight] = useState(false);
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
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: props.message,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        // TTS 開啟時，自動朗讀 AI 回應
        if (ttsEnabled && props.message) {
          speak(props.message).catch(() => {});
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
      const { signedUrl } = await res.json();
      if (!signedUrl) throw new Error('無法取得 signed URL');

      // 純文字模式：不請求麥克風，設定中文語言
      // 傳入 userId 讓 webhook 存入正確的 userId，與 chat 歷史共用同一個 key
      const googleId = (session?.user as { id?: string })?.id;
      await conversation.startSession({
        signedUrl,
        userId: googleId,
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
  }, [conversation, isConnecting, isConnected]);

  // 進入頁面時：載入 DB 歷史 → 觸發問候
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    async function init() {
      // 從 DB 載入歷史對話（含語音通話紀錄）
      try {
        const res = await fetch('/api/chat/history');
        if (res.ok) {
          const history: ChatMessage[] = await res.json();
          if (history.length > 0) {
            setMessages(history);
            return;
          }
        }
      } catch {}

      // 無任何紀錄且有用戶名 → 先連線，Agent 會自動問候
      if (!session?.user?.name) return;
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.name]);

  // ─── 分析對話洞察 ─────────────────────────────────────────────────────────────
  async function analyzeInsight() {
    if (messages.length < 2 || analyzingInsight) return;
    setAnalyzingInsight(true);
    try {
      const res = await fetch('/api/chat/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      if (res.ok) {
        setInsight(await res.json());
      }
    } catch {}
    setAnalyzingInsight(false);
  }

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

    if (conversation.status === 'connected') {
      // 已連線：直接送出
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

      {/* 對話洞察卡片（正向框架） */}
      {insight && (
        <div className="mx-4 mb-2 p-4 rounded-2xl bg-[#F0EBFA] border border-[#DDD5F0]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-[#5B4A8A]">對話洞察</p>
            <button onClick={() => setInsight(null)} className="text-xs text-[#8A8A8A]">收起</button>
          </div>
          <p className="text-sm text-[#2D2D2D] mb-3">{insight.summary}</p>

          {/* 平靜分數 + 狀態 */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                <span className="text-lg font-bold text-[#7C5CBA]">{insight.calmScore}</span>
              </div>
              <div>
                <p className="text-xs text-[#8A8A8A]">平靜指數</p>
                <p className="text-xs text-[#5B4A8A] font-medium">{insight.calmState}</p>
              </div>
            </div>
          </div>

          {/* 情緒基調 */}
          {insight.emotionalTone && (
            <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-white text-[#5B4A8A] mb-3">
              {insight.emotionalTone}
            </span>
          )}

          {/* 內在需求 */}
          {insight.innerNeeds?.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-[#8A8A8A] mb-1">內在需求</p>
              {insight.innerNeeds.map((s: string, i: number) => (
                <p key={i} className="text-sm text-[#2D2D2D]">• {s}</p>
              ))}
            </div>
          )}

          {/* 回歸平靜的路徑 */}
          {insight.growthPaths?.length > 0 && (
            <div>
              <p className="text-xs text-[#8A8A8A] mb-1">回歸平靜的路徑</p>
              {insight.growthPaths.map((s: string, i: number) => (
                <p key={i} className="text-sm text-[#2D2D2D]">• {s}</p>
              ))}
            </div>
          )}

          {insight.needsProfessional && (
            <p className="mt-3 text-xs text-red-500 font-medium">
              建議尋求專業心理諮商協助
            </p>
          )}
        </div>
      )}

      {/* 分析按鈕（有對話紀錄且未在連線中顯示） */}
      {messages.length >= 4 && !isStreaming && !insight && (
        <div className="flex justify-center py-1">
          <button
            onClick={analyzeInsight}
            disabled={analyzingInsight}
            className="text-xs px-4 py-1.5 rounded-full bg-[#F0EBFA] text-[#5B4A8A] hover:bg-[#E4DCF4] transition-colors disabled:opacity-50"
          >
            {analyzingInsight ? '分析中…' : '分析對話洞察'}
          </button>
        </div>
      )}

      {/* 底部輸入框 */}
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}

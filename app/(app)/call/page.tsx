'use client';

// 語音通話頁面 — 簡化版：speak → listen → API → speak → listen...
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  listenUntilSilence,
  stopListening,
  setOnInterim,
  speak,
  stopSpeaking,
} from '@/lib/speech';
import type { ChatMessage } from '@/lib/types';

type CallState = 'idle' | 'listening' | 'thinking' | 'speaking';

export default function CallPage() {
  const router = useRouter();
  const [state, setState] = useState<CallState>('idle');
  const [interimText, setInterimText] = useState('');
  const [aiText, setAiText] = useState('');
  const [duration, setDuration] = useState(0);
  const historyRef = useRef<ChatMessage[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef(false);

  // 計時器
  useEffect(() => {
    if (state !== 'idle' && !timerRef.current) {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => {};
  }, [state]);

  function formatTime(s: number) {
    return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  }

  // ── 開始通話 ──
  async function startCall() {
    abortRef.current = false;
    setDuration(0);
    historyRef.current = [];

    // 1. 小莫先說開場白
    setState('speaking');
    setAiText('嗨，我是小莫，有什麼想聊的嗎？');
    await speak('嗨，我是小莫，有什麼想聊的嗎？');

    // 2. 開始對話循環
    if (!abortRef.current) {
      conversationLoop();
    }
  }

  // ── 對話循環（最簡單的版本）──
  async function conversationLoop() {
    while (!abortRef.current) {
      // ── 聆聽使用者 ──
      setState('listening');
      setInterimText('');
      setAiText('');
      setOnInterim((text) => setInterimText(text));

      let userText = '';
      try {
        userText = await listenUntilSilence(1500);
      } catch {
        // 辨識失敗 → 重試
        continue;
      }

      if (abortRef.current) break;
      if (!userText.trim()) continue; // 沒聽到話 → 重試

      // ── 送 API ──
      setState('thinking');
      setInterimText('');

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: userText,
        timestamp: Date.now(),
      };
      historyRef.current = [...historyRef.current, userMsg];

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userText,
            history: historyRef.current,
          }),
        });

        if (!res.ok || !res.body) throw new Error('API error');

        // 讀取完整回應
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let aiResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          aiResponse += decoder.decode(value, { stream: true });
          setAiText(aiResponse);
        }

        if (abortRef.current) break;

        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: aiResponse,
          timestamp: Date.now(),
        };
        historyRef.current = [...historyRef.current, assistantMsg];

        // ── 朗讀回應 ──
        setState('speaking');
        if (aiResponse) {
          await speak(aiResponse);
        }

        // 朗讀完 → 回到迴圈頂部繼續聽
      } catch {
        setAiText('連線中斷，請稍後再試…');
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  // ── 掛斷 ──
  function endCall() {
    abortRef.current = true;
    stopListening();
    stopSpeaking();
    setOnInterim(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // 有對話 → 存到 sessionStorage 再跳回 chat
    if (historyRef.current.length > 0) {
      sessionStorage.setItem('callHistory', JSON.stringify(historyRef.current));
      router.push('/chat');
    } else {
      setState('idle');
    }
  }

  // 點擊畫面打斷朗讀
  function interrupt() {
    if (state === 'speaking') {
      stopSpeaking();
    }
  }

  const isActive = state !== 'idle';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-[#2D2D2D] to-[#1A1A1A] text-white"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      onClick={interrupt}
    >
      {/* 上方 */}
      <div className="flex flex-col items-center pt-16 gap-2">
        <p className="text-xs text-white/50 tracking-widest uppercase">
          {state === 'idle' ? 'MOLTOS' : formatTime(duration)}
        </p>
        <h1 className="text-2xl font-semibold">小莫</h1>
        <p className="text-sm text-white/60">
          {state === 'idle' && '按下通話開始聊天'}
          {state === 'listening' && '正在聆聽…'}
          {state === 'thinking' && '思考中…'}
          {state === 'speaking' && '小莫正在說話… 點擊可打斷'}
        </p>
      </div>

      {/* 中間 */}
      <div className="flex flex-col items-center gap-6 flex-1 justify-center px-6">
        <div className={`relative w-32 h-32 rounded-full flex items-center justify-center ${
          isActive ? 'bg-[#C67A52]/20' : 'bg-white/10'
        }`}>
          {(state === 'listening' || state === 'speaking') && (
            <>
              <div className="absolute inset-0 rounded-full bg-[#C67A52]/10 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-[-8px] rounded-full border-2 border-[#C67A52]/30 animate-pulse" />
            </>
          )}
          <span className="text-5xl font-bold text-[#C67A52]">M</span>
        </div>

        {state === 'listening' && (
          <div className="flex items-center gap-[3px] h-8">
            {[...Array(24)].map((_, i) => (
              <div
                key={i}
                className="w-[3px] rounded-full bg-[#C67A52]"
                style={{
                  animation: `callWave 1s ease-in-out ${i * 0.04}s infinite`,
                  height: '6px',
                }}
              />
            ))}
          </div>
        )}

        {state === 'thinking' && (
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-3 h-3 rounded-full bg-[#C67A52] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}

        <div className="max-w-sm text-center min-h-[3rem]">
          {state === 'listening' && interimText && (
            <p className="text-white/80 text-sm">{interimText}</p>
          )}
          {(state === 'thinking' || state === 'speaking') && aiText && (
            <p className="text-white/90 text-base leading-relaxed">{aiText}</p>
          )}
        </div>
      </div>

      {/* 下方 */}
      <div className="pb-28 flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
        {!isActive ? (
          <button
            onClick={startCall}
            className="w-20 h-20 rounded-full bg-[#4CAF50] flex items-center justify-center hover:bg-[#43A047] active:scale-95 transition-all shadow-lg shadow-green-500/30"
            aria-label="開始通話"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </button>
        ) : (
          <button
            onClick={endCall}
            className="w-20 h-20 rounded-full bg-[#F44336] flex items-center justify-center hover:bg-[#E53935] active:scale-95 transition-all shadow-lg shadow-red-500/30"
            aria-label="掛斷"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          </button>
        )}
        <p className="text-xs text-white/40">
          {isActive ? '點擊掛斷' : '語音通話'}
        </p>
      </div>

      <style jsx>{`
        @keyframes callWave {
          0%, 100% { height: 6px; }
          50% { height: 28px; }
        }
      `}</style>
    </div>
  );
}

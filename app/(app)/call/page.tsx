'use client';

// 語音通話頁面 — PTT（按住說話）+ Groq Whisper STT + 逐句串流 TTS
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  speak,
  stopSpeaking,
  initSharedAudioContext,
} from '@/lib/speech';
import {
  startManualRecording,
  stopManualRecording,
  stopRecording,
} from '@/lib/recorder';
import { extractCompleteSentences } from '@/lib/sentence-splitter';
import type { ChatMessage } from '@/lib/types';

type CallState = 'idle' | 'ready' | 'listening' | 'thinking' | 'speaking';

export default function CallPage() {
  const router = useRouter();
  const [state, setState] = useState<CallState>('idle');
  const [aiText, setAiText] = useState('');
  const [duration, setDuration] = useState(0);
  const historyRef = useRef<ChatMessage[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef(false);
  const isRecordingRef = useRef(false);

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
    // iOS 音訊解鎖（必須在按鈕點擊的同步上下文中）
    new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=')
      .play().catch(() => {});
    initSharedAudioContext();

    abortRef.current = false;
    setDuration(0);
    historyRef.current = [];

    // 預先取得麥克風授權
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
    } catch { /* 用戶拒絕 → PTT 時再報錯 */ }

    // 小默先說開場白
    setState('speaking');
    setAiText('嗨，我是小默，有什麼想聊的嗎？');
    await speak('嗨，我是小默，有什麼想聊的嗎？');

    if (!abortRef.current) {
      setState('ready');
      setAiText('');
    }
  }

  // ── PTT 按下：開始錄音 ──
  async function handlePTTStart() {
    if (state !== 'ready' || abortRef.current || isRecordingRef.current) return;
    isRecordingRef.current = true;
    setState('listening');
    try {
      await startManualRecording();
    } catch {
      isRecordingRef.current = false;
      setState('ready');
    }
  }

  // ── PTT 放開：停止錄音 → STT → Gemini → TTS ──
  async function handlePTTEnd() {
    if (!isRecordingRef.current) return;
    isRecordingRef.current = false;

    setState('thinking');

    // 取得音訊
    let audioBlob: Blob;
    try {
      audioBlob = await stopManualRecording();
    } catch {
      setState('ready');
      return;
    }

    if (abortRef.current) return;

    // Groq Whisper STT
    let userText = '';
    try {
      const form = new FormData();
      form.append('audio', audioBlob, 'audio.webm');
      const sttRes = await fetch('/api/stt', { method: 'POST', body: form });
      if (sttRes.ok) {
        const data = await sttRes.json();
        userText = data.text ?? '';
      }
    } catch { /* STT 失敗 → 靜默回到 ready */ }

    if (abortRef.current) return;

    if (!userText.trim()) {
      // 沒有辨識到文字 → 回到待機
      setState('ready');
      return;
    }

    // 送 Gemini
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

      // 逐句串流 TTS
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';
      let ttsBuffer = '';
      let speakPromise = Promise.resolve();

      setState('speaking');

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          if (ttsBuffer.trim() && !abortRef.current) {
            const prev = speakPromise;
            speakPromise = prev.then(() =>
              abortRef.current ? Promise.resolve() : speak(ttsBuffer),
            );
          }
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        aiResponse += chunk;
        ttsBuffer += chunk;
        setAiText(aiResponse);

        const { complete, remainder } = extractCompleteSentences(ttsBuffer);
        if (complete && !abortRef.current) {
          const sentenceToSpeak = complete;
          const prev = speakPromise;
          speakPromise = prev.then(() =>
            abortRef.current ? Promise.resolve() : speak(sentenceToSpeak),
          );
          ttsBuffer = remainder;
        }
      }

      await speakPromise;

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now(),
      };
      historyRef.current = [...historyRef.current, assistantMsg];

      if (!abortRef.current) {
        setState('ready');
        setAiText('');
      }
    } catch {
      setAiText('連線中斷，請稍後再試…');
      await new Promise(r => setTimeout(r, 2000));
      if (!abortRef.current) {
        setState('ready');
        setAiText('');
      }
    }
  }

  // ── 掛斷 ──
  function endCall() {
    abortRef.current = true;
    isRecordingRef.current = false;
    stopRecording();
    stopSpeaking();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
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
      if (!abortRef.current) {
        setState('ready');
        setAiText('');
      }
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
        <h1 className="text-2xl font-semibold">小默</h1>
        <p className="text-sm text-white/60">
          {state === 'idle' && '按下通話開始聊天'}
          {state === 'ready' && '按住下方按鈕說話'}
          {state === 'listening' && '正在錄音… 放開送出'}
          {state === 'thinking' && '思考中…'}
          {state === 'speaking' && '小默正在說話… 點擊可打斷'}
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
          {(state === 'thinking' || state === 'speaking') && aiText && (
            <p className="text-white/90 text-base leading-relaxed">{aiText}</p>
          )}
        </div>
      </div>

      {/* 下方 */}
      <div className="pb-28 flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
        {!isActive ? (
          // 開始通話
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
          <div className="flex flex-col items-center gap-4">
            {/* PTT 按鈕 — 按住說話 */}
            {state === 'ready' && (
              <button
                className="w-24 h-24 rounded-full bg-[#C67A52] flex flex-col items-center justify-center gap-1 select-none active:scale-95 active:bg-[#A0623D] transition-all shadow-lg shadow-orange-500/30 touch-none"
                style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
                onPointerDown={e => { e.preventDefault(); handlePTTStart(); }}
                onPointerUp={e => { e.preventDefault(); handlePTTEnd(); }}
                onPointerCancel={e => { e.preventDefault(); handlePTTEnd(); }}
                aria-label="按住說話"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
                <span className="text-white text-[10px] font-medium">按住說話</span>
              </button>
            )}

            {/* 錄音中狀態 */}
            {state === 'listening' && (
              <button
                className="w-24 h-24 rounded-full bg-red-500 flex flex-col items-center justify-center gap-1 select-none transition-all shadow-lg shadow-red-500/50 touch-none"
                style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
                onPointerUp={e => { e.preventDefault(); handlePTTEnd(); }}
                onPointerCancel={e => { e.preventDefault(); handlePTTEnd(); }}
                aria-label="放開送出"
              >
                <div className="w-4 h-4 rounded-full bg-white animate-pulse" />
                <span className="text-white text-[10px] font-medium">放開送出</span>
              </button>
            )}

            {/* 思考/說話中：佔位，避免版面跳動 */}
            {(state === 'thinking' || state === 'speaking') && (
              <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-white/40 text-[10px]">
                  {state === 'thinking' ? '處理中…' : '說話中…'}
                </span>
              </div>
            )}

            {/* 掛斷 */}
            <button
              onClick={endCall}
              className="w-14 h-14 rounded-full bg-[#F44336] flex items-center justify-center hover:bg-[#E53935] active:scale-95 transition-all shadow-lg shadow-red-500/30"
              aria-label="掛斷"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            </button>
          </div>
        )}
        <p className="text-xs text-white/40">
          {!isActive ? '語音通話' : state === 'ready' ? '按住麥克風說話' : '點擊掛斷'}
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

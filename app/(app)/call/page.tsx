'use client';

// 語音通話頁面 — Groq Whisper STT + 逐句串流 TTS + 音量視覺化
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  speak,
  stopSpeaking,
  initSharedAudioContext,
  stopAudioContextKeepalive,
  getSharedAudioCtx,
} from '@/lib/speech';
import { recordUntilSilence, stopRecording } from '@/lib/recorder';
import { extractCompleteSentences } from '@/lib/sentence-splitter';
import type { ChatMessage } from '@/lib/types';

type CallState = 'idle' | 'listening' | 'thinking' | 'speaking';

export default function CallPage() {
  const router = useRouter();
  const [state, setState] = useState<CallState>('idle');
  const [aiText, setAiText] = useState('');
  const [duration, setDuration] = useState(0);
  const [rmsLevel, setRmsLevel] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const historyRef = useRef<ChatMessage[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef(false);
  const sendNowRef = useRef(false);

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
    initSharedAudioContext(); // 也啟動 keepalive

    abortRef.current = false;
    setDuration(0);
    setStatusMsg('');
    historyRef.current = [];

    // 預先取得麥克風授權
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
    } catch {}

    // 小默開場白
    setState('speaking');
    setAiText('嗨，我是小默，有什麼想聊的嗎？');
    await speak('嗨，我是小默，有什麼想聊的嗎？');

    if (!abortRef.current) {
      conversationLoop();
    }
  }

  // ── 對話循環 ──
  async function conversationLoop() {
    let consecutiveErrors = 0;

    while (!abortRef.current) {
      // ── 錄音（靜音 900ms 後自動停止，最多 8 秒等待說話，30 秒絕對上限）──
      setState('listening');
      setRmsLevel(0);
      setAiText('');
      setStatusMsg('');
      sendNowRef.current = false;

      let audioBlob: Blob;
      try {
        audioBlob = await recordUntilSilence(
          getSharedAudioCtx(),
          900,
          (rms) => setRmsLevel(Math.min(rms * 15, 1)), // 放大顯示
        );
        consecutiveErrors = 0;
      } catch {
        consecutiveErrors++;
        if (consecutiveErrors >= 3) {
          setStatusMsg('無法存取麥克風，請確認瀏覽器麥克風權限');
          setState('idle');
          break;
        }
        continue;
      }

      if (abortRef.current) break;
      setRmsLevel(0);

      // ── Groq Whisper STT ──
      setState('thinking');
      let userText = '';
      try {
        const form = new FormData();
        // 用正確的副檔名（iOS 回傳 audio/mp4，桌面回傳 audio/webm）
        const ext = audioBlob.type.includes('mp4') ? 'audio.mp4' : 'audio.webm';
        form.append('audio', audioBlob, ext);
        const sttRes = await fetch('/api/stt', { method: 'POST', body: form });
        if (sttRes.ok) {
          const data = await sttRes.json();
          userText = data.text ?? '';
        } else {
          setStatusMsg(`STT 錯誤 ${sttRes.status}`);
        }
      } catch {
        setStatusMsg('網路錯誤，重新嘗試…');
        continue;
      }

      if (abortRef.current) break;

      if (!userText.trim()) {
        setStatusMsg('沒有偵測到聲音，再試一次');
        continue;
      }

      setStatusMsg('');

      // ── 送 Gemini ──
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

        // 喇叭殘音緩衝：避免麥克風立刻接到 AI 聲音
        if (!abortRef.current) {
          await new Promise(r => setTimeout(r, 600));
        }

        if (abortRef.current) break;

        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: aiResponse,
          timestamp: Date.now(),
        };
        historyRef.current = [...historyRef.current, assistantMsg];
      } catch {
        setStatusMsg('連線中斷，請稍後再試…');
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  // ── 掛斷 ──
  function endCall() {
    abortRef.current = true;
    stopRecording();
    stopSpeaking();
    stopAudioContextKeepalive();
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
          {state === 'listening' && '正在聆聽… 說完後會自動偵測'}
          {state === 'thinking' && '思考中…'}
          {state === 'speaking' && '小默正在說話… 點擊可打斷'}
        </p>
        {statusMsg && (
          <p className="text-xs text-yellow-400/80 mt-1">{statusMsg}</p>
        )}
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

        {/* 音量視覺化 — 聆聽時顯示 RMS 音量條 */}
        {state === 'listening' && (
          <div className="flex items-end gap-[3px] h-10">
            {[...Array(24)].map((_, i) => {
              // 音量條高度：靜音時固定 4px，有聲音時按 RMS 放大
              const threshold = i / 24;
              const active = rmsLevel > threshold;
              const barH = active
                ? Math.max(8, Math.min(40, 8 + (rmsLevel - threshold) * 200))
                : 4;
              return (
                <div
                  key={i}
                  className={`w-[3px] rounded-full transition-all duration-75 ${
                    active ? 'bg-[#C67A52]' : 'bg-white/20'
                  }`}
                  style={{ height: `${barH}px` }}
                />
              );
            })}
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

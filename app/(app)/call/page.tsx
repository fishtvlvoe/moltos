'use client';

// 語音通話頁面 — ElevenLabs Conversational AI SDK
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useConversation } from '@11labs/react';
import { getAgentId, mapConversationStatus } from '@/lib/elevenlabs';
// Role 型別由 SDK 內部 callback 推斷，不需額外 import
import type { CallState } from '@/types/elevenlabs';

export default function CallPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [callState, setCallState] = useState<CallState>('idle');
  const [duration, setDuration] = useState(0);
  const [inputVolume, setInputVolume] = useState(0);
  const [outputVolume, setOutputVolume] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);
  const hasConnectedRef = useRef(false); // 記錄是否曾經連線（用於掛斷後決定是否跳轉）
  const audioCtxRef = useRef<AudioContext | null>(null);
  const dialingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function playDialingBeep(audioContextRef: { current: AudioContext | null }) {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = audioContextRef.current ?? new AudioContextClass();
    audioContextRef.current = ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 440;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  }

  function playConnectChime(ctx: AudioContext) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  }

  const clearDialingInterval = useCallback(() => {
    if (dialingIntervalRef.current) {
      clearInterval(dialingIntervalRef.current);
      dialingIntervalRef.current = null;
    }
  }, []);

  // ─── ElevenLabs SDK ──────────────────────────────────────────────────────────
  const conversation = useConversation({
    onConnect: ({ conversationId }: { conversationId: string }) => {
      console.info('[ElevenLabs] 連線建立，conversation_id:', conversationId);
      clearDialingInterval();
      if (audioCtxRef.current) {
        playConnectChime(audioCtxRef.current);
      }
      hasConnectedRef.current = true;
      // 啟動音量輪詢動畫
      startVolumePolling();
    },
    onDisconnect: () => {
      console.info('[ElevenLabs] 連線已中斷');
      clearDialingInterval();
      stopVolumePolling();
      // 如果曾經連線才跳轉到聊天紀錄頁
      // 等 2 秒讓 ElevenLabs post-call webhook 有時間寫入 DB 再跳轉
      if (hasConnectedRef.current) {
        setTimeout(() => router.push('/chat'), 2000);
      }
    },
    onError: (message: string, context?: unknown) => {
      console.error('[ElevenLabs] 錯誤:', message, context);
      clearDialingInterval();
      stopVolumePolling();
    },
    onMessage: (props) => {
      console.log('[ElevenLabs] 訊息:', props);
    },
  });

  // ─── 音量輪詢（requestAnimationFrame 驅動，只在連線時執行）─────────────────
  const startVolumePolling = useCallback(() => {
    const poll = () => {
      setInputVolume(Math.min(1, Math.max(0, conversation.getInputVolume())));
      setOutputVolume(Math.min(1, Math.max(0, conversation.getOutputVolume())));
      rafRef.current = requestAnimationFrame(poll);
    };
    rafRef.current = requestAnimationFrame(poll);
  }, [conversation]);

  const stopVolumePolling = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setInputVolume(0);
    setOutputVolume(0);
  }, []);

  // ─── 監聽 SDK 狀態，同步 callState ──────────────────────────────────────────
  useEffect(() => {
    setCallState(mapConversationStatus(conversation.status, conversation.isSpeaking));
  }, [conversation.status, conversation.isSpeaking]);

  // ─── 計時器（非 idle 時啟動）────────────────────────────────────────────────
  useEffect(() => {
    if (callState !== 'idle') {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setDuration(0);
    }
  }, [callState]);

  // ─── 清理（元件卸載時）──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopVolumePolling();
      if (timerRef.current) clearInterval(timerRef.current);
      clearDialingInterval();
    };
  }, [clearDialingInterval, stopVolumePolling]);

  // ─── 開始通話 ───────────────────────────────────────────────────────────────
  const startCall = async () => {
    // iOS 音訊解鎖：建立 AudioContext + 播放靜音，確保音訊系統完全就緒
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) throw new Error('AudioContext not supported');
      const ctx = audioCtxRef.current ?? new AudioContextClass();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') await ctx.resume();
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start();
    } catch {}
    // 額外等待讓 iOS 音訊管線完全啟動
    await new Promise((r) => setTimeout(r, 500));

    hasConnectedRef.current = false;
    setCallState('connecting');
    clearDialingInterval();
    playDialingBeep(audioCtxRef);
    dialingIntervalRef.current = setInterval(() => {
      playDialingBeep(audioCtxRef);
    }, 2000);

    try {
      // 先從後端取得 signed URL，避免 agentId 直連被 LiveKit 404 拒絕
      const res = await fetch('/api/elevenlabs-signed-url');
      const { signedUrl } = await res.json();
      if (!signedUrl) throw new Error('無法取得 signed URL');

      const googleId = (session?.user as { id?: string } | undefined)?.id;

      // 撈取文字對話歷史，格式化後傳入 Agent，提供記憶上下文（失敗不阻斷通話）
      let historyText = '（尚無歷史對話）';
      try {
        const histRes = await fetch('/api/chat/history');
        if (histRes.ok) {
          const history: { role: string; content: string }[] = await histRes.json();
          const recent = history.slice(-20);
          if (recent.length > 0) {
            historyText = recent.map(m => `${m.role === 'user' ? '用戶' : '小默'}：${m.content}`).join('\n');
          }
        }
      } catch {}

      await conversation.startSession({
        signedUrl,
        dynamicVariables: {
          user_id: googleId ?? '',
          conversation_history: historyText,
        },
      });
    } catch (error) {
      console.error('[ElevenLabs] 連線失敗:', error);
      clearDialingInterval();
      setCallState('idle');
    }
  };

  // ─── 掛斷 ───────────────────────────────────────────────────────────────────
  const endCall = async () => {
    clearDialingInterval();
    await conversation.endSession();
    // 強制釋放麥克風，避免靜默超時後 agent 重新說話
    try {
      const streams = await navigator.mediaDevices.getUserMedia({ audio: true });
      streams.getTracks().forEach(track => track.stop());
    } catch {}
    // onDisconnect 回調會處理跳轉邏輯
  };

  // ─── 輔助函式 ────────────────────────────────────────────────────────────────
  function formatTime(s: number) {
    return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  }

  // 音量條顯示：聆聽時用 inputVolume（麥克風），說話時用 outputVolume（AI 聲音）
  const activeVolume = callState === 'speaking' ? outputVolume : inputVolume;
  const isActive = callState !== 'idle';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-[#2D2D2D] to-[#1A1A1A] text-white"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* 上方 */}
      <div className="flex flex-col items-center pt-16 gap-2">
        <p className="text-xs text-white/50 tracking-widest uppercase">
          {callState === 'idle' ? 'MOLTOS' : formatTime(duration)}
        </p>
        <h1 className="text-2xl font-semibold">小默</h1>
        <p className="text-sm text-white/60">
          {callState === 'idle' && '按下通話開始聊天'}
          {callState === 'connecting' && '連線中…'}
          {callState === 'listening' && '正在聆聽…'}
          {callState === 'speaking' && '小默正在說話…'}
        </p>
      </div>

      {/* 中間 */}
      <div className="flex flex-col items-center gap-6 flex-1 justify-center px-6">
        {/* 頭像圓形 + 波浪動畫 */}
        <div className={`relative w-32 h-32 rounded-full flex items-center justify-center ${
          isActive ? 'bg-[#C67A52]/20' : 'bg-white/10'
        }`}>
          {(callState === 'listening' || callState === 'speaking') && (
            <>
              <div
                className="absolute inset-0 rounded-full bg-[#C67A52]/10 animate-ping"
                style={{ animationDuration: '2s' }}
              />
              <div className="absolute inset-[-8px] rounded-full border-2 border-[#C67A52]/30 animate-pulse" />
            </>
          )}
          {callState === 'connecting' && (
            <div className="absolute inset-[-8px] rounded-full border-2 border-white/20 animate-pulse" />
          )}
          <span className="text-5xl font-bold text-[#C67A52]">M</span>
        </div>

        {/* 音量條視覺化 — 連線中（聆聽 / 說話）顯示 */}
        {(callState === 'listening' || callState === 'speaking') && (
          <div className="flex items-end gap-[3px] h-10">
            {[...Array(24)].map((_, i) => {
              const threshold = i / 24;
              const active = activeVolume > threshold;
              const barH = active
                ? Math.max(8, Math.min(40, 8 + (activeVolume - threshold) * 200))
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

        {/* 連線中載入動畫 */}
        {callState === 'connecting' && (
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-3 h-3 rounded-full bg-[#C67A52] animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 下方按鈕 */}
      <div className="pb-28 flex flex-col items-center gap-3">
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
            disabled={callState === 'connecting'}
            className="w-20 h-20 rounded-full bg-[#F44336] flex items-center justify-center hover:bg-[#E53935] active:scale-95 transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}

/**
 * speech.ts — Web Speech API 封裝層
 *
 * 提供 STT（語音轉文字）與 TTS（文字轉語音）功能。
 * 僅限在 client component 中呼叫，不需要 'use client' 宣告。
 */

import type { RefObject } from "react";

// ── 型別補充（Web Speech API 不在所有 TypeScript lib 中）──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionType = any;

// ─────────────────────────────────────────
// STT（語音轉文字）— SpeechRecognition
// ─────────────────────────────────────────

/**
 * STT 狀態隔離：以「component 的 ref.current（HTMLElement）」當作 key，避免多個元件互相污染。
 * 非 component 情境（例如 listenUntilSilence）則使用預設 key。
 */
type SttKey = object;

type SttState = {
  recognitionInstance: SpeechRecognitionType | null;
  manualStop: boolean;
  onInterimCallback: ((text: string) => void) | null;
  stopTimeoutId: ReturnType<typeof setTimeout> | null;
  stopAbortController: AbortController | null;
  hasFocused: boolean;
};

const DEFAULT_STT_KEY: SttKey = {};
const sttStateByKey = new WeakMap<SttKey, SttState>();

function getSttState(key: SttKey): SttState {
  let state = sttStateByKey.get(key);
  if (!state) {
    state = {
      recognitionInstance: null,
      manualStop: false,
      onInterimCallback: null,
      stopTimeoutId: null,
      stopAbortController: null,
      hasFocused: false,
    };
    sttStateByKey.set(key, state);
  }
  return state;
}

function getKeyFromRef(ref: RefObject<HTMLElement>): HTMLElement | null {
  return ref.current ?? null;
}

/**
 * 檢查瀏覽器是否支援語音辨識。
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

/**
 * 設定即時辨識回調。
 * - setOnInterim(ref, cb): component-level（隔離）
 * - setOnInterim(cb): legacy/global（給非 component 使用）
 */
export function setOnInterim(cb: ((text: string) => void) | null): void;
export function setOnInterim(ref: RefObject<HTMLElement>, cb: ((text: string) => void) | null): void;
export function setOnInterim(
  refOrCb: RefObject<HTMLElement> | ((text: string) => void) | null,
  cb?: ((text: string) => void) | null,
): void {
  if (typeof refOrCb === "function" || refOrCb === null) {
    getSttState(DEFAULT_STT_KEY).onInterimCallback = refOrCb;
    return;
  }

  const key = getKeyFromRef(refOrCb);
  if (!key) return;
  getSttState(key).onInterimCallback = cb ?? null;
}

/**
 * 開始語音辨識（持續模式）。
 * 回傳 Promise<{ text: string; instance: SpeechRecognitionType }>
 * 在使用者手動呼叫 stopListening() 時 resolve 完整文字與實例。
 * 語言：zh-TW。
 */
export function startListening(ref: RefObject<HTMLElement>): Promise<{ text: string; instance: SpeechRecognitionType }> {
  return new Promise((resolve, reject) => {
    const key = getKeyFromRef(ref);
    if (!key) {
      reject(new Error("找不到語音輸入元件 ref"));
      return;
    }

    const state = getSttState(key);

    if (!isSpeechRecognitionSupported()) {
      reject(new Error("此瀏覽器不支援語音辨識"));
      return;
    }

    // 只在第一次開始聆聽時嘗試 focus，避免重複搶焦點
    if (!state.hasFocused) {
      state.hasFocused = true;
      try {
        ref.current?.focus();
      } catch {
        // ignore
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognitionAPI();
    state.recognitionInstance = recognition;
    state.manualStop = false;

    // 若之前 stop 設了 timeout，先清掉
    if (state.stopTimeoutId) clearTimeout(state.stopTimeoutId);
    state.stopTimeoutId = null;
    state.stopAbortController = null;

    recognition.lang = "zh-TW";
    recognition.continuous = true;       // 持續聽，不會聽到一段就停
    recognition.interimResults = true;   // 即時回傳辨識中的文字
    recognition.maxAlternatives = 1;

    let finalTranscript = '';

    const cleanupStopTimeout = () => {
      if (state.stopTimeoutId) clearTimeout(state.stopTimeoutId);
      state.stopTimeoutId = null;
      state.stopAbortController = null;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      // 若 state 已切到別的 instance，忽略舊事件
      if (state.recognitionInstance !== recognition) return;

      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      // 回調即時文字給 UI（最終 + 暫時）
      state.onInterimCallback?.(finalTranscript + interim);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (state.recognitionInstance !== recognition) return;

      if (event.error === "aborted" || event.error === "no-speech") {
        cleanupStopTimeout();
        return;
      }
      // not-allowed = 使用者拒絕麥克風權限
      cleanupStopTimeout();
      reject(new Error(`語音辨識錯誤：${event.error}`));
    };

    recognition.onend = () => {
      if (state.recognitionInstance !== recognition) return;

      cleanupStopTimeout();

      if (state.manualStop) {
        // 使用者主動停止 → resolve 最終文字與實例
        state.recognitionInstance = null;
        resolve({ text: finalTranscript, instance: recognition });
      } else {
        // 瀏覽器自動斷線（例如短暫靜音）→ 自動重啟
        try {
          recognition.start();
        } catch {
          state.recognitionInstance = null;
          resolve({ text: finalTranscript, instance: recognition });
        }
      }
    };

    recognition.start();
  });
}

/**
 * 通話模式聆聽 — 停說話後自動偵測靜音，超過 silenceMs 毫秒自動 resolve。
 * 用於語音通話的自動循環。
 */
export function listenUntilSilence(silenceMs = 1500): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isSpeechRecognitionSupported()) {
      reject(new Error("此瀏覽器不支援語音辨識"));
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognitionAPI();
    const state = getSttState(DEFAULT_STT_KEY);
    state.recognitionInstance = recognition;
    state.manualStop = false;

    recognition.lang = "zh-TW";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalTranscript = '';
    let silenceTimer: ReturnType<typeof setTimeout> | null = null;
    let hasSpoken = false;

    function resetSilenceTimer() {
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        // 有講過話才自動停止，沒講話就繼續等
        if (hasSpoken && finalTranscript.trim()) {
          state.manualStop = true;
          recognition.stop();
        }
      }, silenceMs);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
          hasSpoken = true;
        } else {
          interim += result[0].transcript;
          if (interim) hasSpoken = true;
        }
      }
      state.onInterimCallback?.(finalTranscript + interim);
      // 每次收到辨識結果，重設靜音計時器
      resetSilenceTimer();
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      if (silenceTimer) clearTimeout(silenceTimer);
      reject(new Error(`語音辨識錯誤：${event.error}`));
    };

    recognition.onend = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      if (state.manualStop || finalTranscript.trim()) {
        state.recognitionInstance = null;
        resolve(finalTranscript);
      } else {
        // 沒講話就斷了 → 重啟
        try {
          recognition.start();
        } catch {
          state.recognitionInstance = null;
          resolve(finalTranscript);
        }
      }
    };

    recognition.start();
    // 開始時啟動靜音計時器（等使用者開口）
    resetSilenceTimer();
  });
}

/**
 * 手動停止語音辨識（component-level）。
 *
 * - 以 ref 隔離不同元件的 STT 狀態，避免互相污染。
 * - 2 秒 timeout：如果 stop() 沒有觸發 onend，會改用 abort() 強制結束。
 */
export function stopListening(ref: RefObject<HTMLElement>): void {
  const key = getKeyFromRef(ref);
  if (!key) return;

  const state = getSttState(key);
  state.manualStop = true;
  state.onInterimCallback = null;

  const target = state.recognitionInstance;
  if (!target) return;

  // 清掉舊的 timeout
  if (state.stopTimeoutId) clearTimeout(state.stopTimeoutId);

  const ac = new AbortController();
  state.stopAbortController = ac;

  state.stopTimeoutId = setTimeout(() => {
    // 若 onend 已清理或已 abort，跳過
    if (state.stopAbortController !== ac || ac.signal.aborted) return;

    ac.abort();
    try {
      target.abort();
    } catch {
      // ignore
    }
  }, 2000);

  // stop() 理論上會觸發 onend → resolve
  try {
    target.stop();
  } catch {
    // stop() 失敗就直接走 abort（會觸發 onerror: aborted）
    try {
      ac.abort();
      target.abort();
    } catch {
      // ignore
    }
  }
}

// ─────────────────────────────────────────
// TTS（文字轉語音）
// ─────────────────────────────────────────

/**
 * 檢查瀏覽器是否支援語音合成。
 */
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** 共用 AudioContext — iOS 需透過此播放，不能每次 new Audio() */
let sharedAudioCtx: AudioContext | null = null;
/** iOS keepalive：定期播靜音 buffer，防止 AudioContext 自動掛起 */
let keepAliveInterval: ReturnType<typeof setInterval> | null = null;
/** 目前播放中的 AudioBufferSourceNode（AudioContext 路徑） */
let currentSource: AudioBufferSourceNode | null = null;
/** 目前播放中的 Audio 元素（fallback 路徑） */
let currentAudio: HTMLAudioElement | null = null;

/**
 * 回傳目前共用的 AudioContext（供 recorder.ts 使用）。
 */
export function getSharedAudioCtx(): AudioContext | null {
  return sharedAudioCtx;
}

/**
 * 在 user gesture 的同步上下文呼叫，建立並解鎖共用 AudioContext。
 * iOS 必須在按鈕點擊的 call stack 內執行才能持久解鎖音訊播放。
 * 不需要 await — 只需「建立 + 呼叫 resume()」動作本身即可解鎖。
 */
export function initSharedAudioContext(): void {
  if (typeof window === 'undefined') return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AC();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    // 啟動 keepalive：每 2 秒播一個靜音 buffer，防止 iOS 掛起 AudioContext
    if (!keepAliveInterval) {
      keepAliveInterval = setInterval(() => {
        if (!sharedAudioCtx) return;
        if (sharedAudioCtx.state === 'suspended') {
          sharedAudioCtx.resume().catch(() => {});
        }
        if (sharedAudioCtx.state === 'running') {
          try {
            const buf = sharedAudioCtx.createBuffer(1, 1, sharedAudioCtx.sampleRate);
            const src = sharedAudioCtx.createBufferSource();
            src.buffer = buf;
            src.connect(sharedAudioCtx.destination);
            src.start();
          } catch {}
        }
      }, 2000);
    }
  } catch {
    // 環境不支援，靜默處理
  }
}

/** 停止 AudioContext keepalive（掛斷通話時呼叫） */
export function stopAudioContextKeepalive(): void {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

/**
 * 將文字用語音朗讀出來。
 * 優先路徑：ElevenLabs TTS → AudioContext 播放（iOS 友好）
 * 備用路徑：ElevenLabs TTS → Audio element（桌面）
 * 最終退路：瀏覽器內建 SpeechSynthesis
 */
export async function speak(text: string): Promise<void> {
  const cleanText = text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
  if (!cleanText) return;

  // ElevenLabs TTS（12 秒 timeout，手機網路 + cold start 可能需要 5-8 秒）
  try {
    const controller = new AbortController();
    const ttsTimeout = setTimeout(() => controller.abort(), 12000);
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText }),
      signal: controller.signal,
    });
    clearTimeout(ttsTimeout);

    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();

      // ── 優先路徑：<audio> 元素 ──
      // iOS + 麥克風同時開著時，AudioContext 走耳機路由（沒聲音）
      // <audio> playsInline 用 media playback session → 揚聲器，無視靜音鍵
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audioOk = await new Promise<boolean>((resolve) => {
        const audio = new Audio(url);
        (audio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
        currentAudio = audio;
        let settled = false;
        const estimatedMs = Math.max(8000, cleanText.length * 250 + 2000);
        const done = (ok: boolean) => {
          if (settled) return;
          settled = true;
          clearTimeout(safetyTimer);
          currentAudio = null;
          URL.revokeObjectURL(url);
          resolve(ok);
        };
        const safetyTimer = setTimeout(() => done(true), estimatedMs);
        audio.onended = () => done(true);
        audio.onerror = () => done(false);
        audio.play().catch(() => done(false));
      });

      if (audioOk) return;

      // ── 備用路徑：AudioContext（<audio> 被 iOS autoplay 擋住時使用）──
      if (sharedAudioCtx && sharedAudioCtx.state === 'running') {
        return await new Promise<void>((resolve) => {
          let settled = false;
          let safetyTimer: ReturnType<typeof setTimeout>;

          const done = () => {
            if (settled) return;
            settled = true;
            clearTimeout(safetyTimer);
            currentSource = null;
            resolve();
          };

          sharedAudioCtx!.decodeAudioData(
            arrayBuffer,
            (decoded) => {
              safetyTimer = setTimeout(done, decoded.duration * 1000 + 1500);
              const source = sharedAudioCtx!.createBufferSource();
              currentSource = source;
              source.buffer = decoded;
              source.connect(sharedAudioCtx!.destination);
              source.onended = done;
              source.start();
            },
            done,
          );
        });
      }
    }
  } catch {
    // TTS 失敗，退回瀏覽器內建
  }

  // 最終退路：瀏覽器內建 SpeechSynthesis
  if (!isSpeechSynthesisSupported()) return;

  return new Promise<void>((resolve) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "zh-TW";
    utterance.rate = 0.9;
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      clearTimeout(safetyTimer);
      resolve();
    };
    const safetyTimer = setTimeout(done, Math.max(5000, cleanText.length * 200 + 3000));
    utterance.onend = done;
    utterance.onerror = done;
    window.speechSynthesis.speak(utterance);
  });
}

/**
 * 停止朗讀。
 */
export function stopSpeaking(): void {
  // 停止 AudioContext 播放
  if (currentSource) {
    const source = currentSource;
    currentSource = null;
    try { source.stop(); source.disconnect(); } catch { /* 已停止 */ }
  }
  // 停止 Audio element 播放
  if (currentAudio) {
    const audio = currentAudio;
    currentAudio = null;
    audio.pause();
    audio.dispatchEvent(new Event('ended'));
  }
  // 停止瀏覽器內建 TTS
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

// ─────────────────────────────────────────
// 麥克風音量偵測（用於語音打斷）
// ─────────────────────────────────────────

let micMonitorCleanup: (() => void) | null = null;

/**
 * 開始監聽麥克風音量，超過門檻時呼叫 onVoiceDetected。
 * 用於 AI 朗讀時偵測使用者開口說話。
 */
export async function startMicMonitor(
  onVoiceDetected: () => void,
  threshold = 55,  // 音量門檻提高（過濾鍵盤聲、環境噪音）
): Promise<void> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let active = true;
    let consecutiveHits = 0; // 連續超過門檻的次數
    const requiredHits = 4;  // 需要連續 4 幀（約 250ms）才算人聲
    // 延遲 800ms 才開始偵測（避免抓到 TTS 尾音）
    let ready = false;
    setTimeout(() => { ready = true; }, 800);

    function check() {
      if (!active) return;
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      if (ready && avg > threshold) {
        consecutiveHits++;
        if (consecutiveHits >= requiredHits) {
          // 連續偵測到高音量 → 確認是人在說話
          active = false;
          cleanup();
          onVoiceDetected();
          return;
        }
      } else {
        consecutiveHits = 0; // 重置（短暫噪音不算）
      }
      requestAnimationFrame(check);
    }

    function cleanup() {
      active = false;
      stream.getTracks().forEach(t => t.stop());
      ctx.close().catch(() => {});
    }

    micMonitorCleanup = cleanup;
    check();
  } catch {
    // 麥克風存取失敗，靜默處理
  }
}

/**
 * 停止麥克風音量監聽。
 */
export function stopMicMonitor(): void {
  if (micMonitorCleanup) {
    micMonitorCleanup();
    micMonitorCleanup = null;
  }
}

/**
 * 邊朗讀邊監聽 — AI 說話時若偵測到使用者開口，立刻停止朗讀。
 * 回傳 { interrupted: boolean, earlyText: string }
 * - interrupted=true: 使用者打斷了，earlyText 是已辨識到的開頭文字
 * - interrupted=false: 朗讀完成，沒有被打斷
 */
export function speakWithInterrupt(text: string): Promise<{ interrupted: boolean; earlyText: string }> {
  return new Promise((resolve) => {
    if (!isSpeechSynthesisSupported()) {
      resolve({ interrupted: false, earlyText: '' });
      return;
    }

    const cleanText = text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
    if (!cleanText) { resolve({ interrupted: false, earlyText: '' }); return; }

    let interrupted = false;
    let earlyText = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let monitor: any = null;

    // 開始朗讀
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "zh-TW";
    utterance.rate = 0.9;

    utterance.onend = () => {
      if (monitor) { try { monitor.abort(); } catch {} }
      if (!interrupted) resolve({ interrupted: false, earlyText: '' });
    };
    utterance.onerror = () => {
      if (monitor) { try { monitor.abort(); } catch {} }
      resolve({ interrupted, earlyText });
    };

    window.speechSynthesis.speak(utterance);

    // 同時用麥克風監聽使用者是否開口
    if (isSpeechRecognitionSupported()) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        monitor = new SpeechRecognitionAPI();
        monitor.lang = "zh-TW";
        monitor.continuous = false;
        monitor.interimResults = true;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        monitor.onresult = (event: any) => {
          // 偵測到使用者說話 → 打斷 AI
          interrupted = true;
          earlyText = event.results[0][0].transcript || '';
          window.speechSynthesis.cancel();
          try { monitor.abort(); } catch {}
          resolve({ interrupted: true, earlyText });
        };

        monitor.onerror = () => {}; // 靜默
        monitor.onend = () => {}; // 不重啟

        monitor.start();
      } catch {
        // 監聽失敗不影響朗讀
      }
    }
  });
}

// ─── toTraditionalChinese ────────────────────────────────────────────────────

/**
 * 常見簡體字→繁體字對照表（高頻 STT 誤輸出）
 *
 * 只轉換 STT 最常見的簡繁差異字，非全量字典。
 * 非中文字元（英文、數字、符號）不受影響。
 */
const SIMPLIFIED_TO_TRADITIONAL: Record<string, string> = {
  // 常用高頻字
  开: '開', 关: '關', 来: '來', 没: '沒', 还: '還',
  这: '這', 那: '那', 们: '們', 时: '時', 问: '問',
  话: '話', 说: '說', 让: '讓', 给: '給', 对: '對',
  为: '為', 会: '會', 个: '個', 样: '樣', 么: '麼',
  问题: '問題', 时间: '時間', 东西: '東西', 关系: '關係',
  开心: '開心', 开始: '開始', 来自: '來自', 没有: '沒有',
  还是: '還是', 这个: '這個', 那个: '那個', 我们: '我們',
  他们: '他們', 她们: '她們', 你们: '你們', 让我: '讓我',
  说话: '說話', 会话: '會話', 对话: '對話', 为什么: '為什麼',
};

/**
 * 將 STT 輸出的簡體中文轉換為繁體中文。
 *
 * 使用靜態字典做字元映射，不依賴外部套件。
 * 英文、數字、標點等非中文內容不受影響。
 *
 * @param text STT 輸出的原始文字
 * @returns 轉換後的繁體中文文字
 */
export function toTraditionalChinese(text: string): string {
  if (!text) return text;

  // 先做長詞替換（避免短字元替換破壞長詞）
  let result = text;
  const entries = Object.entries(SIMPLIFIED_TO_TRADITIONAL);

  // 先替換長詞（長度降序）
  const sortedEntries = entries.sort((a, b) => b[0].length - a[0].length);
  for (const [simplified, traditional] of sortedEntries) {
    result = result.split(simplified).join(traditional);
  }

  return result;
}

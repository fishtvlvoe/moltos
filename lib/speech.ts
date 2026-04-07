/**
 * speech.ts — Web Speech API 封裝層
 *
 * 提供 STT（語音轉文字）與 TTS（文字轉語音）功能。
 * 僅限在 client component 中呼叫，不需要 'use client' 宣告。
 */

// ── 型別補充（Web Speech API 不在所有 TypeScript lib 中）──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionType = any;

// ─────────────────────────────────────────
// STT（語音轉文字）— SpeechRecognition
// ─────────────────────────────────────────

/** 目前使用中的辨識器實例，stopListening() 時需要存取 */
let recognitionInstance: SpeechRecognitionType | null = null;

/**
 * 檢查瀏覽器是否支援語音辨識。
 */
export function isSpeechRecognitionSupported(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return typeof window !== "undefined" &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

/** 手動停止旗標，區分「使用者停止」和「瀏覽器自動斷線」 */
let manualStop = false;

/** 即時辨識結果回調（給 UI 即時顯示用） */
let onInterimCallback: ((text: string) => void) | null = null;

/**
 * 設定即時辨識回調 — UI 元件可透過此函式取得辨識中的暫時文字
 */
export function setOnInterim(cb: ((text: string) => void) | null): void {
  onInterimCallback = cb;
}

/**
 * 開始語音辨識（持續模式）。
 * 回傳 Promise<string>，在使用者手動呼叫 stopListening() 時 resolve 完整文字。
 * 語言：zh-TW。
 */
export function startListening(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isSpeechRecognitionSupported()) {
      reject(new Error("此瀏覽器不支援語音辨識"));
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognitionAPI();
    recognitionInstance = recognition;
    manualStop = false;

    recognition.lang = "zh-TW";
    recognition.continuous = true;       // 持續聽，不會聽到一段就停
    recognition.interimResults = true;   // 即時回傳辨識中的文字
    recognition.maxAlternatives = 1;

    let finalTranscript = '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
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
      if (onInterimCallback) {
        onInterimCallback(finalTranscript + interim);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      // not-allowed = 使用者拒絕麥克風權限
      reject(new Error(`語音辨識錯誤：${event.error}`));
    };

    recognition.onend = () => {
      if (manualStop) {
        // 使用者主動停止 → resolve 最終文字
        recognitionInstance = null;
        resolve(finalTranscript);
      } else {
        // 瀏覽器自動斷線（例如短暫靜音）→ 自動重啟
        try {
          recognition.start();
        } catch {
          recognitionInstance = null;
          resolve(finalTranscript);
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
    recognitionInstance = recognition;
    manualStop = false;

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
          manualStop = true;
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
      if (onInterimCallback) {
        onInterimCallback(finalTranscript + interim);
      }
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
      if (manualStop || finalTranscript.trim()) {
        recognitionInstance = null;
        resolve(finalTranscript);
      } else {
        // 沒講話就斷了 → 重啟
        try {
          recognition.start();
        } catch {
          recognitionInstance = null;
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
 * 手動停止語音辨識。
 */
export function stopListening(): void {
  manualStop = true;
  onInterimCallback = null;
  if (recognitionInstance) {
    recognitionInstance.stop(); // stop() 會觸發 onend → resolve
    recognitionInstance = null;
  }
}

// ─────────────────────────────────────────
// TTS（文字轉語音）— SpeechSynthesis
// ─────────────────────────────────────────

/**
 * 檢查瀏覽器是否支援語音合成。
 */
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** 目前播放中的 Audio 元素，用於 stopSpeaking */
let currentAudio: HTMLAudioElement | null = null;

/**
 * 將文字用語音朗讀出來。
 * 優先使用 Google Cloud TTS（自然語音），失敗退回瀏覽器內建。
 */
export async function speak(text: string): Promise<void> {
  const cleanText = text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
  if (!cleanText) return;

  // 先嘗試 Google Cloud TTS
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText }),
    });

    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      return await new Promise<void>((resolve) => {
        const audio = new Audio(url);
        currentAudio = audio;
        let settled = false;
        const done = () => {
          if (settled) return;
          settled = true;
          clearTimeout(safetyTimer);
          currentAudio = null;
          URL.revokeObjectURL(url);
          resolve();
        };
        // iOS 上 onended 有時不觸發，加 safety timeout（文字長度估算播放時間 + 5s）
        const estimatedMs = Math.max(3000, cleanText.length * 100 + 1000);
        const safetyTimer = setTimeout(done, estimatedMs);
        audio.onended = done;
        audio.onerror = done;
        audio.play().catch(done);
      });
    }
  } catch {
    // Google TTS 失敗，退回瀏覽器內建
  }

  // 退回瀏覽器內建 TTS
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
    // iOS SpeechSynthesis onend 也不穩定，同樣加 safety timeout
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
  // 停止 OpenAI TTS 播放 — 觸發 ended 事件讓 speak() 的 Promise resolve
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

/**
 * recorder.ts — MediaRecorder + ScriptProcessor VAD
 *
 * 核心修復（v3）：
 * - 進 ScriptProcessor 前先 ctxForVAD.resume()，解決 iOS AudioContext 被掛起問題
 * - RMS 門檻降至 0.003（之前 0.008 太高）
 * - 加 onRms 回調，讓 UI 可即時顯示音量條
 */

let mediaRecorderInstance: MediaRecorder | null = null;

export function isMediaRecorderSupported(): boolean {
  return typeof window !== 'undefined' && !!window.MediaRecorder;
}

export function stopRecording(): void {
  if (mediaRecorderInstance && mediaRecorderInstance.state === 'recording') {
    mediaRecorderInstance.stop();
  }
  mediaRecorderInstance = null;
}

/**
 * 錄音直到靜音。
 *
 * VAD：ScriptProcessorNode 讀 PCM 計算 RMS，rms > 0.003 視為有聲音。
 * 說話後靜音 silenceMs 毫秒自動停止。
 *
 * @param audioCtx  已解鎖的 AudioContext（call/page.tsx 傳入）
 * @param silenceMs 靜音多久後停止（預設 900ms）
 * @param onRms     即時 RMS 回調（供 UI 音量視覺化，0~1 之間）
 */
export async function recordUntilSilence(
  audioCtx: AudioContext | null,
  silenceMs = 900,
  onRms?: (rms: number) => void,
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    // 1. 取得麥克風
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      reject(new Error('無法存取麥克風'));
      return;
    }

    // 2. 選擇 iOS 相容格式
    const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', '']
      .find(t => !t || MediaRecorder.isTypeSupported(t)) ?? '';

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorderInstance = recorder;
    const chunks: Blob[] = [];
    let hasSpoken = false;
    let silenceTimer: ReturnType<typeof setTimeout> | null = null;
    let active = true;

    const doStop = () => {
      if (active && recorder.state === 'recording') recorder.stop();
    };

    // 3. ScriptProcessor VAD
    let processor: ScriptProcessorNode | null = null;
    let vadSrc: MediaStreamAudioSourceNode | null = null;
    let silentGain: GainNode | null = null;

    // 優先使用傳入 ctx，進入前先嘗試 resume（iOS 可能掛起）
    let ctxForVAD: AudioContext | null = audioCtx ?? null;

    if (ctxForVAD) {
      try {
        // 關鍵修復：主動 resume，iOS 掛起後仍可喚醒（已解鎖過的 ctx）
        if (ctxForVAD.state !== 'running') {
          await ctxForVAD.resume();
        }
      } catch { ctxForVAD = null; }

      if (ctxForVAD?.state !== 'running') ctxForVAD = null;
    }

    if (!ctxForVAD) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        ctxForVAD = new AC() as AudioContext;
        await ctxForVAD.resume().catch(() => {});
      } catch { ctxForVAD = null; }
    }

    if (ctxForVAD) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        processor = (ctxForVAD as any).createScriptProcessor(2048, 1, 1) as ScriptProcessorNode;
        vadSrc = ctxForVAD.createMediaStreamSource(stream);

        // gain=0：必須連 destination 讓 iOS 允許 ScriptProcessor 運作，但不回授
        silentGain = ctxForVAD.createGain();
        silentGain.gain.value = 0;

        vadSrc.connect(processor);
        processor.connect(silentGain);
        silentGain.connect(ctxForVAD.destination);

        processor.onaudioprocess = (event) => {
          if (!active) return;
          const pcm = event.inputBuffer.getChannelData(0);
          let sum = 0;
          for (let i = 0; i < pcm.length; i++) sum += pcm[i] * pcm[i];
          const rms = Math.sqrt(sum / pcm.length);

          onRms?.(rms);

          if (rms > 0.003) {
            // 有聲音
            hasSpoken = true;
            if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
          } else if (hasSpoken && !silenceTimer) {
            // 說過話後偵測到靜音 → 開始倒數
            silenceTimer = setTimeout(doStop, silenceMs);
          }
        };
      } catch {
        processor = null;
      }
    }

    const cleanup = () => {
      active = false;
      onRms?.(0);
      if (silenceTimer) clearTimeout(silenceTimer);
      clearTimeout(noSpeechTimer);
      clearTimeout(maxTimer);
      try {
        processor?.disconnect();
        vadSrc?.disconnect();
        silentGain?.disconnect();
      } catch {}
      stream.getTracks().forEach(t => t.stop());
      mediaRecorderInstance = null;
    };

    // 8 秒都沒說話 → 停止（UI 可提示重試）
    const noSpeechTimer = setTimeout(() => {
      if (!hasSpoken) doStop();
    }, 8000);

    // 30 秒絕對上限
    const maxTimer = setTimeout(doStop, 30000);

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      cleanup();
      resolve(new Blob(chunks, { type: mimeType || 'audio/webm' }));
    };

    recorder.onerror = () => {
      cleanup();
      reject(new Error('錄音失敗'));
    };

    recorder.start();
  });
}

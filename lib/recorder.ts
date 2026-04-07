/**
 * recorder.ts — Push-to-Talk 手動錄音
 *
 * VAD 在 iOS 太不穩定，改用 PTT（按住說話）模式：
 * startManualRecording() → 開始錄音
 * stopManualRecording()  → 停止並回傳 Blob
 */

let mediaRecorderInstance: MediaRecorder | null = null;
let manualStream: MediaStream | null = null;
let manualChunks: Blob[] = [];

export function isMediaRecorderSupported(): boolean {
  return typeof window !== 'undefined' && !!window.MediaRecorder;
}

/** 停止任何進行中的錄音（掛斷時用） */
export function stopRecording(): void {
  if (mediaRecorderInstance && mediaRecorderInstance.state === 'recording') {
    mediaRecorderInstance.stop();
  }
  manualStream?.getTracks().forEach(t => t.stop());
  manualStream = null;
  mediaRecorderInstance = null;
}

/**
 * PTT 開始：取得麥克風 + 開始錄音。
 * 必須在 user gesture（pointerdown）context 內呼叫，iOS 才能存取麥克風。
 */
export async function startManualRecording(): Promise<void> {
  // 清理上一次殘留
  stopRecording();
  manualChunks = [];

  try {
    manualStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    throw new Error('無法存取麥克風');
  }

  const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', '']
    .find(t => !t || MediaRecorder.isTypeSupported(t)) ?? '';

  const recorder = new MediaRecorder(
    manualStream,
    mimeType ? { mimeType } : undefined,
  );
  mediaRecorderInstance = recorder;

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) manualChunks.push(e.data);
  };

  // 不指定 timeslice — iOS mp4 container 在 stop 時一次 flush，最可靠
  recorder.start();
}

/**
 * PTT 結束：停止錄音並回傳音訊 Blob。
 */
export function stopManualRecording(): Promise<Blob> {
  return new Promise((resolve) => {
    const recorder = mediaRecorderInstance;
    const stream = manualStream;
    const chunks = manualChunks;

    const finalize = (mimeType: string) => {
      stream?.getTracks().forEach(t => t.stop());
      manualStream = null;
      mediaRecorderInstance = null;
      resolve(new Blob(chunks, { type: mimeType || 'audio/webm' }));
    };

    if (!recorder || recorder.state !== 'recording') {
      finalize('audio/webm');
      return;
    }

    const mimeType = recorder.mimeType;
    recorder.onstop = () => finalize(mimeType);
    recorder.stop();
  });
}

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { startListening, stopListening, isSpeechRecognitionSupported, setOnInterim } from '@/lib/speech';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

/**
 * 聊天輸入框元件
 *
 * 兩種模式：
 * 1. 打字模式（預設）：左邊麥克風、中間輸入框、右邊送出
 * 2. 語音模式（錄音中）：全寬音波動畫 + 停止按鈕
 */
export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** 瀏覽器是否支援語音辨識 */
  const [supported, setSupported] = useState(false);
  useEffect(() => { setSupported(isSpeechRecognitionSupported()); }, []);

  /** 焦點管理：語音模式結束時恢復 textarea 焦點 */
  useEffect(() => {
    if (!isListening && textareaRef.current && document.activeElement !== textareaRef.current) {
      // 只在 textarea 沒被其他元素搶走焦點時才恢復
      textareaRef.current.focus();
    }
  }, [isListening]);

  /** 送出訊息 */
  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, disabled, onSend]);

  /** Enter 送出、Shift+Enter 換行 */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /** textarea 自動高度 */
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
  };

  /** 開始語音辨識 */
  async function handleMicStart() {
    if (!supported) {
      alert('語音輸入需要使用 Chrome 瀏覽器。\n\nBrave 用戶可在 brave://flags 搜尋「speech」並啟用。');
      return;
    }
    setIsListening(true);
    setInterimText('');
    // 註冊即時辨識回調，讓 UI 即時顯示辨識文字
    setOnInterim(textareaRef as any, (text) => setInterimText(text));
    try {
      const result = await startListening(textareaRef as any);
      if (result.text.trim()) {
        setValue(prev => prev ? prev + ' ' + result.text : result.text);
      }
    } catch {
      // 靜默處理
    } finally {
      setIsListening(false);
      setInterimText('');
      setOnInterim(textareaRef as any, null);
    }
  }

  /** 停止語音辨識 */
  function handleMicStop() {
    stopListening(textareaRef as any);
    setIsListening(false);
  }

  // ── 語音模式：全寬錄音介面 ──
  if (isListening) {
    return (
      <div className="sticky bottom-0 bg-[#FAF8F4] border-t border-stone-200 px-4 py-3">
        <div className="flex flex-col gap-2 rounded-2xl border border-red-300 bg-red-50 px-4 py-3">
          {/* 上方：音波 + 停止按鈕 */}
          <div className="flex items-center gap-3">
            {/* 音波動畫 */}
            <div className="flex-1 flex items-center justify-center gap-[3px] h-8">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="w-[3px] rounded-full bg-red-400"
                  style={{
                    animation: `waveform 1s ease-in-out ${i * 0.05}s infinite`,
                    height: '6px',
                  }}
                />
              ))}
            </div>
            {/* 停止按鈕 */}
            <button
              type="button"
              onClick={handleMicStop}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 active:scale-95 transition-all"
              aria-label="停止錄音"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          </div>
          {/* 下方：即時辨識文字 */}
          <p className="text-sm text-[#5A5A5A] min-h-[1.25rem] truncate">
            {interimText || '正在聆聽，請說話…'}
          </p>
        </div>
        {/* 音波動畫 CSS */}
        <style jsx>{`
          @keyframes waveform {
            0%, 100% { height: 6px; }
            50% { height: 24px; }
          }
        `}</style>
      </div>
    );
  }

  // ── 打字模式：正常輸入介面 ──
  return (
    <div className="sticky bottom-0 bg-[#FAF8F4] border-t border-stone-200 px-4 py-3">
      <div
        className={`
          flex items-center gap-2 rounded-2xl border px-3 py-2
          transition-colors
          ${disabled
            ? 'bg-stone-100 border-stone-200 opacity-60'
            : 'bg-white border-stone-300 focus-within:border-[#C67A52]'
          }
        `}
      >
        {/* 麥克風按鈕 — 與送出按鈕同尺寸 */}
        <button
          type="button"
          onClick={handleMicStart}
          disabled={disabled}
          aria-label="語音輸入"
          className={`
            flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
            transition-colors
            ${disabled
              ? 'text-stone-300 cursor-not-allowed'
              : 'text-[#8A8A8A] hover:text-[#C67A52] hover:bg-stone-100 active:scale-95'
            }
          `}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="2" width="6" height="11" rx="3" />
            <path d="M5 10a7 7 0 0 0 14 0" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="8" y1="22" x2="16" y2="22" />
          </svg>
        </button>

        {/* 文字輸入框 */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="輸入訊息…"
          aria-label="聊天訊息輸入框"
          className={`
            flex-1 resize-none bg-transparent text-base leading-relaxed outline-none
            placeholder:text-stone-400
            ${disabled ? 'cursor-not-allowed text-stone-400' : 'text-stone-800'}
          `}
          style={{ maxHeight: '144px', overflowY: 'auto' }}
        />

        {/* 送出按鈕 — 與麥克風同尺寸 */}
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          aria-label="送出訊息"
          className={`
            flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
            transition-colors
            ${disabled || !value.trim()
              ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
              : 'bg-[#C67A52] text-white hover:bg-[#b36843] active:scale-95'
            }
          `}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

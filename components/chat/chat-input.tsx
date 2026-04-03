'use client';

import { useState, useRef, useCallback } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

/**
 * 聊天輸入框元件
 *
 * - 左側：麥克風 icon（純 UI，點擊顯示「即將推出」提示）
 * - 中間：多行文字輸入框（Enter 送出、Shift+Enter 換行）
 * - 右側：送出按鈕（箭頭 icon）
 * - disabled 時輸入框與按鈕均灰掉
 * - 固定在頁面底部（sticky bottom）
 */
export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [micAlert, setMicAlert] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** 送出訊息 */
  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    // 重設 textarea 高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, disabled, onSend]);

  /** 鍵盤事件：Enter 送出、Shift+Enter 換行 */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /** 自動調整 textarea 高度（最多 6 行） */
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`; // 144px ≈ 6 行
  };

  /** 麥克風點擊：顯示即將推出提示 */
  const handleMicClick = () => {
    setMicAlert(true);
    setTimeout(() => setMicAlert(false), 2000);
  };

  return (
    <div className="sticky bottom-0 bg-[#FAF8F4] border-t border-stone-200 px-4 py-3">
      {/* 即將推出提示（替代 toast） */}
      {micAlert && (
        <div
          className="mb-2 text-xs text-center text-stone-500 bg-stone-100 rounded-lg py-1 px-3 transition-opacity"
          role="status"
          aria-live="polite"
        >
          🎤 語音輸入即將推出
        </div>
      )}

      <div
        className={`
          flex items-end gap-2 rounded-2xl border px-3 py-2
          transition-colors
          ${disabled
            ? 'bg-stone-100 border-stone-200 opacity-60'
            : 'bg-white border-stone-300 focus-within:border-[#C67A52]'
          }
        `}
      >
        {/* 麥克風 icon（純 UI） */}
        <button
          type="button"
          onClick={handleMicClick}
          disabled={disabled}
          aria-label="語音輸入（即將推出）"
          className={`
            flex-shrink-0 mb-1 p-1 rounded-full transition-colors
            ${disabled
              ? 'text-stone-300 cursor-not-allowed'
              : 'text-stone-400 hover:text-[#C67A52] hover:bg-stone-100'
            }
          `}
        >
          {/* 麥克風 SVG icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
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
            flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none
            placeholder:text-stone-400
            ${disabled ? 'cursor-not-allowed text-stone-400' : 'text-stone-800'}
          `}
          style={{ maxHeight: '144px', overflowY: 'auto' }}
        />

        {/* 送出按鈕（箭頭 icon） */}
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          aria-label="送出訊息"
          className={`
            flex-shrink-0 mb-1 w-8 h-8 rounded-full flex items-center justify-center
            transition-colors
            ${disabled || !value.trim()
              ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
              : 'bg-[#C67A52] text-white hover:bg-[#b36843] active:scale-95'
            }
          `}
        >
          {/* 向上箭頭 SVG icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

'use client';

import type { ChatMessage } from '@/lib/types';
import { BlockCursor } from '@/components/icons/custom-icons';

interface MessageBubbleProps {
  message: ChatMessage;
}

/**
 * 將 Unix 毫秒時間戳轉換為 HH:mm 格式
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 訊息氣泡元件
 *
 * - User 訊息：靠右對齊，深色背景（#C67A52），白色文字，右上角方角
 * - Assistant 訊息：靠左對齊，淺色背景（#F0EBE4），深色文字，左上角方角，附圓形 avatar
 * - isStreaming 為 true 時顯示閃爍游標 ▌
 */
export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Assistant 的圓形 Avatar */}
      {!isUser && (
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
          style={{ backgroundColor: '#C67A52' }}
          aria-label="Moltos AI 助理"
        >
          M
        </div>
      )}

      {/* 氣泡主體 */}
      <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`
            px-4 py-2 text-sm leading-relaxed break-words
            ${isUser
              ? 'rounded-2xl rounded-tr-sm text-white'   /* user：右上角方角 */
              : 'rounded-2xl rounded-tl-sm'              /* assistant：左上角方角 */
            }
          `}
          style={
            isUser
              ? { backgroundColor: '#C67A52' }
              : { backgroundColor: '#F0EBE4', color: '#3D2B1F' }
          }
        >
          {/* 訊息內容 */}
          <span>{message.content}</span>

          {/* 串流閃爍游標 */}
          {message.isStreaming && (
            <span
              className={`ml-0.5 inline-flex items-center ${isUser ? 'text-white/80' : 'text-[#C67A52]'}`}
              aria-hidden="true"
            >
              <BlockCursor className="inline-block align-middle animate-[block-cursor-blink_1s_linear_infinite]" />
            </span>
          )}
        </div>

        {/* 時間戳 */}
        <span className="text-xs text-stone-400 px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>

      <style jsx>{`
        @keyframes block-cursor-blink {
          0%,
          100% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

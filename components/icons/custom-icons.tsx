import React from 'react';

interface IconProps {
  className?: string;
}

/**
 * BlockCursor — 遊標指示器
 * 替換原本的 `▌` emoji，用於聊天訊息串流中的遊標動畫
 */
export function BlockCursor({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 垂直方形遊標 */}
      <rect x="4" y="2" width="4" height="20" rx="1" ry="1" />
    </svg>
  );
}

/**
 * RecordingDot — 錄音指示器
 * 替換原本的 `●` emoji，用於表示正在錄音或串流中的狀態
 */
export function RecordingDot({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 圓形錄音指示器 */}
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

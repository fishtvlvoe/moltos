'use client';

// T039 — 今日摘要卡片
// 從 /api/youtube/feed 取得 VideoSummary[]，顯示縮圖、標題、頻道名
// 每則可展開/收合 AI 摘要；最多顯示 5 部影片

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { VideoSummary } from '@/lib/types';

// 強調色（設計規格）
const ACCENT_COLOR = '#C67A52';

// ─── Skeleton 載入佔位元件（3 個條狀骨架）───────────────────────────────────
function SkeletonList() {
  return (
    <Card className="rounded-2xl bg-[#FAF8F4] ring-1 ring-[#EDE8E0]">
      <CardHeader>
        {/* 標題骨架 */}
        <div className="h-5 w-28 rounded bg-[#EDE8E0] animate-pulse" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 items-start">
            {/* 縮圖骨架 */}
            <div className="h-16 w-24 flex-shrink-0 rounded-lg bg-[#EDE8E0] animate-pulse" />
            <div className="flex flex-col gap-2 flex-1">
              {/* 標題骨架 */}
              <div className="h-4 w-full rounded bg-[#EDE8E0] animate-pulse" />
              {/* 頻道名骨架 */}
              <div className="h-3 w-24 rounded bg-[#EDE8E0] animate-pulse" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── 單部影片列表項元件 ──────────────────────────────────────────────────────
function VideoItem({ video }: { video: VideoSummary }) {
  // 控制 AI 摘要展開/收合狀態（預設收合）
  const [expanded, setExpanded] = useState(false);

  // 切換摘要展開狀態
  const toggleSummary = (e: React.MouseEvent) => {
    e.preventDefault(); // 避免觸發外層的 <a> 跳轉
    setExpanded((prev) => !prev);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* 影片主要資訊列（縮圖 + 文字） */}
      <div className="flex gap-3 items-start">
        {/* 縮圖 — 點擊在新分頁開啟 YouTube */}
        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0"
          aria-label={`開啟影片：${video.title}`}
        >
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="h-16 w-24 rounded-lg object-cover hover:opacity-90 transition-opacity"
          />
        </a>

        {/* 標題 + 頻道名 + 摘要按鈕 */}
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          {/* 標題 — 點擊在新分頁開啟 YouTube，超出截斷 */}
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[#2D2D2D] truncate hover:underline"
            title={video.title}
          >
            {video.title}
          </a>

          {/* 頻道名（小字灰色） */}
          <span className="text-xs text-[#8A8A8A]">{video.channelName}</span>

          {/* 摘要展開/收合按鈕 */}
          <button
            onClick={toggleSummary}
            className="mt-1 self-start text-xs font-medium transition-colors"
            style={{ color: ACCENT_COLOR }}
            aria-expanded={expanded}
            aria-label={expanded ? '收合 AI 摘要' : '展開 AI 摘要'}
          >
            {expanded ? '收合摘要 ▲' : '摘要 ▼'}
          </button>
        </div>
      </div>

      {/* AI 摘要展開區塊 */}
      {expanded && (
        <div className="rounded-lg bg-[#F0EBE3] px-3 py-2">
          <p className="text-xs leading-relaxed text-[#5A5A5A]">
            {/* summary 未定義時顯示生成中提示 */}
            {video.summary ?? '摘要生成中...'}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── 主元件 ──────────────────────────────────────────────────────────────────
export function NewsCard() {
  const [videos, setVideos] = useState<VideoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 從 API 取得影片清單
  useEffect(() => {
    let cancelled = false;

    async function fetchVideos() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/youtube/feed');
        if (!res.ok) {
          throw new Error(`API 回應錯誤：${res.status}`);
        }
        const data: VideoSummary[] = await res.json();
        if (!cancelled) {
          // 最多顯示 5 部影片
          setVideos(data.slice(0, 5));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '無法取得資料');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchVideos();

    // 防止元件卸載後更新 state
    return () => { cancelled = true; };
  }, []);

  // ── Loading 狀態 ──
  if (loading) return <SkeletonList />;

  // ── Error 狀態 ──
  if (error) {
    return (
      <Card className="rounded-2xl bg-[#F5F5F5] ring-1 ring-[#E0E0E0]">
        <CardHeader>
          <CardTitle className="text-[#9E9E9E]">今日摘要</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#9E9E9E]">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // ── 空狀態 ──
  if (videos.length === 0) {
    return (
      <Card className="rounded-2xl bg-[#FAF8F4] ring-1 ring-[#EDE8E0]">
        <CardHeader>
          <CardTitle className="text-[#2D2D2D]">今日摘要</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#8A8A8A]">今天還沒有新影片，請稍後再回來看看。</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md rounded-2xl bg-[#FAF8F4] ring-1 ring-[#EDE8E0]">
      <CardHeader className="pb-2">
        <CardTitle className="text-[#2D2D2D]">今日摘要</CardTitle>
        {/* 顯示影片數量小字提示 */}
        <p className="text-xs text-[#8A8A8A]">
          為你整理 {videos.length} 部最新影片
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {videos.map((video, index) => (
          <div key={video.videoId}>
            <VideoItem video={video} />
            {/* 分隔線（最後一項不顯示） */}
            {index < videos.length - 1 && (
              <hr className="mt-4 border-[#EDE8E0]" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default NewsCard;

'use client';

// T025 — 平靜指數卡片
// 從 /api/calm-index 抓取快照，顯示分數圓環、等級標籤與四維度橫條圖

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CalmIndexSnapshot } from '@/lib/types';

// ─── 維度中文對照表 ──────────────────────────────────────────────────────────
const DIMENSION_LABELS: Record<string, string> = {
  messageVolume: '訊息量',
  replyLatency: '回覆速度',
  nightActivity: '深夜活躍',
  unreadPileup: '未讀堆積',
  voiceEmotion: '語音情緒', // MVP 不顯示，保留對照
};

// 等級設定：中文標籤 + 顏色
const LEVEL_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  calm:     { label: '平靜',   color: '#4CAF50', bgColor: '#E8F5E9' },
  mild:     { label: '輕微波動', color: '#FFC107', bgColor: '#FFF8E1' },
  moderate: { label: '需留意', color: '#FF9800', bgColor: '#FFF3E0' },
  attention:{ label: '需關注', color: '#F44336', bgColor: '#FFEBEE' },
};

// 強調色（設計規格）
const ACCENT_COLOR = '#C67A52';

// ─── 分數圓環元件 ────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const radius = 54;           // 圓環半徑
  const stroke = 8;            // 線條寬度
  const cx = 64;               // SVG 中心 x
  const cy = 64;               // SVG 中心 y
  const circumference = 2 * Math.PI * radius;
  // score 0–100 → 以 stroke-dashoffset 控制進度
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="128" height="128" role="img" aria-label={`平靜指數 ${score} 分`}>
        {/* 背景軌道 */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#EDE8E0"
          strokeWidth={stroke}
        />
        {/* 進度圈 — 從 12 點鐘方向開始 */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={ACCENT_COLOR}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        {/* 中間分數文字 */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="28"
          fontWeight="700"
          fill="#2D2D2D"
          style={{ fontFamily: 'var(--font-ibm-plex-sans, sans-serif)' }}
        >
          {score}
        </text>
        {/* 「分」小字 */}
        <text
          x={cx}
          y={cy + 18}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="12"
          fill="#8A8A8A"
          style={{ fontFamily: 'var(--font-ibm-plex-sans, sans-serif)' }}
        >
          分
        </text>
      </svg>
    </div>
  );
}

// ─── 維度橫條圖元件 ──────────────────────────────────────────────────────────
function DimensionBar({
  name,
  score,
}: {
  name: string;
  score: number;
}) {
  const label = DIMENSION_LABELS[name] ?? name;
  const pct = Math.min(100, Math.max(0, score));

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-[#5A5A5A]">
        <span>{label}</span>
        <span className="font-medium text-[#2D2D2D]">{Math.round(pct)}</span>
      </div>
      {/* 橫條軌道 */}
      <div className="h-2 w-full rounded-full bg-[#EDE8E0]">
        {/* 進度條 */}
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: ACCENT_COLOR }}
        />
      </div>
    </div>
  );
}

// ─── Skeleton 載入佔位元件 ───────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <Card className="rounded-2xl bg-[#FAF8F4] ring-1 ring-[#EDE8E0]">
      <CardHeader>
        {/* 標題骨架 */}
        <div className="h-5 w-24 rounded bg-[#EDE8E0] animate-pulse" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* 圓環骨架 */}
        <div className="flex justify-center">
          <div className="h-32 w-32 rounded-full bg-[#EDE8E0] animate-pulse" />
        </div>
        {/* 橫條骨架 ×4 */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="h-3 w-28 rounded bg-[#EDE8E0] animate-pulse" />
            <div className="h-2 w-full rounded-full bg-[#EDE8E0] animate-pulse" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── 主元件 ──────────────────────────────────────────────────────────────────
export function CalmIndexCard() {
  const [snapshot, setSnapshot] = useState<CalmIndexSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 從 API 取得平靜指數快照
  useEffect(() => {
    let cancelled = false;

    async function fetchSnapshot() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/calm-index');
        if (!res.ok) {
          throw new Error(`API 回應錯誤：${res.status}`);
        }
        const data: CalmIndexSnapshot = await res.json();
        if (!cancelled) setSnapshot(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '無法取得資料');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSnapshot();

    // 防止元件卸載後更新 state
    return () => { cancelled = true; };
  }, []);

  // ── Loading 狀態 ──
  if (loading) return <SkeletonCard />;

  // ── Error 狀態 ──
  if (error || !snapshot) {
    return (
      <Card className="rounded-2xl bg-[#F5F5F5] ring-1 ring-[#E0E0E0]">
        <CardHeader>
          <CardTitle className="text-[#9E9E9E]">平靜指數</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#9E9E9E]">
            {error ?? '資料暫時無法載入，請稍後再試。'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { result, coverageDays, isStale } = snapshot;
  const levelCfg = LEVEL_CONFIG[result.level] ?? LEVEL_CONFIG.calm;

  // MVP 排除 voiceEmotion 維度
  const visibleDimensions = result.dimensions.filter(
    (d) => d.dimension !== 'voiceEmotion'
  );

  return (
    <Card className="rounded-2xl bg-[#FAF8F4] ring-1 ring-[#EDE8E0]">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[#2D2D2D]">平靜指數</CardTitle>
          {/* 資料陳舊標示 */}
          {isStale && (
            <span className="text-xs text-[#B0B0B0]">資料較舊</span>
          )}
        </div>
        {/* 資料覆蓋天數說明 */}
        <p className="text-xs text-[#8A8A8A]">
          過去 {coverageDays} 天的通訊行為分析
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {/* 分數圓環 */}
        <div className="flex flex-col items-center gap-2">
          <ScoreRing score={Math.round(result.score)} />
          {/* 等級 Badge — 用 inline style 套入等級顏色 */}
          <Badge
            style={{
              backgroundColor: levelCfg.bgColor,
              color: levelCfg.color,
              borderColor: 'transparent',
            }}
          >
            {levelCfg.label}
          </Badge>
        </div>

        {/* 分隔線 */}
        <hr className="border-[#EDE8E0]" />

        {/* 四維度橫條圖 */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium text-[#8A8A8A]">各維度分析</p>
          {visibleDimensions.map((dim) => (
            <DimensionBar
              key={dim.dimension}
              name={dim.dimension}
              score={dim.score}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default CalmIndexCard;

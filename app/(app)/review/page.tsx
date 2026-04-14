'use client';

// 回顧頁面 — 平靜指數趨勢 + 對話洞察歷史
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import type { ChatMessage } from '@/lib/types';

type CalmEntry = { score: number; level: string; createdAt: string };

type InsightEntry = {
  id: string;
  summary: string;
  calm_state: string;
  calm_score: number;
  inner_needs: string[];
  growth_paths: string[];
  emotional_tone: string;
  message_count: number;
  created_at: string;
};

type DailyPoint = {
  date: string;
  score: number;
  level: string;
};

const LEVEL_LABELS: Record<string, string> = {
  calm: '平靜',
  mild: '輕微波動',
  moderate: '需留意',
  attention: '需關注',
};

const LEVEL_COLORS: Record<string, string> = {
  calm: '#4CAF50',
  mild: '#FFC107',
  moderate: '#FF9800',
  attention: '#F44336',
};

function scoreColor(score: number): string {
  if (score >= 70) return '#4CAF50';
  if (score >= 50) return '#FFC107';
  if (score >= 30) return '#FF9800';
  return '#F44336';
}

/** 依本地日期分組，每日取當天最後一筆（時間上最新）為代表值，最舊 → 最新排序 */
function groupCalmHistoryByDay(entries: CalmEntry[]): DailyPoint[] {
  if (entries.length === 0) return [];

  const sorted = [...entries].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const byDay = new Map<string, CalmEntry>();

  for (const e of sorted) {
    const d = new Date(e.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    byDay.set(key, e);
  }

  const keys = Array.from(byDay.keys()).sort();

  return keys.map((k) => {
    const e = byDay.get(k)!;
    const d = new Date(e.createdAt);

    return {
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      score: Math.round(e.score),
      level: e.level,
    };
  });
}

function CalmTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: DailyPoint }[];
}) {
  if (!active || !payload?.length) return null;

  const p = payload[0].payload;

  return (
    <div className="rounded-lg border border-[#EDE8E0] bg-white px-2 py-1.5 text-xs shadow-sm">
      <p className="text-[#8A8A8A]">{p.date}</p>

      <p className="font-medium text-[#2D2D2D]">平靜指數 {p.score}</p>

      <p style={{ color: LEVEL_COLORS[p.level] ?? '#8A8A8A' }}>
        {LEVEL_LABELS[p.level] ?? p.level}
      </p>
    </div>
  );
}

function ActiveDot({ cx, cy, onClick, payload }: { cx?: number; cy?: number; onClick: (pt: DailyPoint) => void; payload?: DailyPoint }) {
  const handleKeyDown = (e: React.KeyboardEvent<SVGCircleElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && payload) {
      e.preventDefault();
      onClick(payload);
    }
  };

  return (
    <circle
      cx={cx}
      cy={cy}
      r={6}
      fill="#7C5CBA"
      stroke="#fff"
      strokeWidth={2}
      style={{ cursor: 'pointer' }}
      onClick={() => payload && onClick(payload)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={payload ? `查看 ${payload.date} 詳細` : undefined}
    />
  );
}

export default function ReviewPage() {
  const [history, setHistory] = useState<CalmEntry[]>([]);
  const [insights, setInsights] = useState<InsightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingRecent, setAnalyzingRecent] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<DailyPoint | null>(null);
  const [insightsExpanded, setInsightsExpanded] = useState(false);

  const dailyPoints = useMemo(() => groupCalmHistoryByDay(history), [history]);

  const loadInsights = useCallback(async () => {
    const insightRes = await fetch('/api/chat/insight/history');

    if (insightRes.ok) {
      setInsights(await insightRes.json());
    }
  }, []);

  useEffect(() => {
    async function load() {
      const [calmRes, insightRes] = await Promise.allSettled([
        fetch('/api/calm-index/history?days=30'),
        fetch('/api/chat/insight/history'),
      ]);

      if (calmRes.status === 'fulfilled' && calmRes.value.ok) {
        setHistory(await calmRes.value.json());
      }

      if (insightRes.status === 'fulfilled' && insightRes.value.ok) {
        setInsights(await insightRes.value.json());
      }

      setLoading(false);
    }

    load();
  }, []);

  async function handleAnalyzeRecent() {
    setAnalyzeError(null);
    setAnalyzingRecent(true);

    try {
      const histRes = await fetch('/api/chat/history');

      if (!histRes.ok) {
        setAnalyzeError('分析失敗，請稍後再試');
        setAnalyzingRecent(false);

        return;
      }

      const messages: ChatMessage[] = await histRes.json();

      if (!Array.isArray(messages) || messages.length < 2) {
        setAnalyzeError('對話紀錄不足，請先與小莫多聊幾句');
        setAnalyzingRecent(false);

        return;
      }

      const res = await fetch('/api/analyze-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });

      if (!res.ok) {
        setAnalyzeError('分析失敗，請稍後再試');
        setAnalyzingRecent(false);

        return;
      }

      await loadInsights();
      setSelectedDay(null);
    } catch {
      setAnalyzeError('分析失敗，請稍後再試');
    }

    setAnalyzingRecent(false);
  }

  return (
    <div className="flex flex-col gap-6 py-2">
      <h1 className="text-xl font-semibold text-[#2D2D2D]">回顧</h1>

      {/* ── 平靜指數趨勢 ── */}
      <Card className="rounded-2xl bg-[#FAF8F4] ring-1 ring-[#EDE8E0]">
        <CardHeader className="pb-2">
          <CardTitle className="text-[#2D2D2D]">平靜指數趨勢</CardTitle>

          <p className="text-xs text-[#8A8A8A]">過去 30 天的變化</p>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-3 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 rounded bg-[#EDE8E0] animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm text-[#8A8A8A]">尚未有平靜指數紀錄</p>

              <p className="text-xs text-[#B0B0B0] mt-1">
                登入後使用 Dashboard，這裡會顯示你的趨勢
              </p>
            </div>
          ) : dailyPoints.length === 1 ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex items-center gap-3 rounded-2xl border border-[#EDE8E0] bg-white px-6 py-4">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white"
                  style={{ backgroundColor: scoreColor(dailyPoints[0].score) }}
                >
                  {dailyPoints[0].score}
                </div>

                <div>
                  <p className="text-xs text-[#8A8A8A]">
                    {dailyPoints[0].date} 平靜指數
                  </p>

                  <p
                    className="text-sm font-medium"
                    style={{ color: LEVEL_COLORS[dailyPoints[0].level] ?? '#5B4A8A' }}
                  >
                    {LEVEL_LABELS[dailyPoints[0].level] ?? dailyPoints[0].level}
                  </p>
                </div>
              </div>

              <p className="text-center text-xs text-[#B0B0B0]">
                資料累積中，將在有更多記錄後顯示趨勢
              </p>
            </div>
          ) : (
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dailyPoints}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDE8E0" />

                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#8A8A8A' }}
                    tickLine={false}
                  />

                  <YAxis
                    domain={[0, 100]}
                    width={28}
                    tick={{ fontSize: 10, fill: '#8A8A8A' }}
                    tickLine={false}
                  />

                  <Tooltip content={<CalmTooltip />} />

                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#7C5CBA"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={<ActiveDot onClick={(pt: DailyPoint) => setSelectedDay(pt)} />}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {selectedDay && dailyPoints.length > 1 && (
            <div className="mt-3 rounded-lg border border-[#DDD5F0] bg-[#F8F5FD] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#5B4A8A]">
                  {selectedDay.date} 詳細
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="text-[#8A8A8A] hover:text-[#2D2D2D] px-1 flex items-center"
                  aria-label="關閉詳細"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: scoreColor(selectedDay.score) }}
                >
                  {selectedDay.score}
                </div>
                <div>
                  <p className="text-sm text-[#2D2D2D]">
                    平靜指數 {selectedDay.score}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: LEVEL_COLORS[selectedDay.level] ?? '#8A8A8A' }}
                  >
                    {LEVEL_LABELS[selectedDay.level] ?? selectedDay.level}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!loading && (
            <div className="mt-4 flex flex-col items-center gap-2 border-t border-[#EDE8E0] pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={analyzingRecent}
                onClick={handleAnalyzeRecent}
                className="rounded-full border-[#DDD5F0] bg-[#F0EBFA] px-6 py-3 text-base text-[#5B4A8A] hover:bg-[#E4DCF4]"
              >
                {analyzingRecent ? '分析中…' : '平靜分析'}
              </Button>

              {analyzeError && (
                <p className="text-center text-xs text-red-500">{analyzeError}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 對話洞察歷史 ── */}
      <Card className="rounded-2xl bg-[#FAF8F4] ring-1 ring-[#EDE8E0]">
        <CardHeader
          className="cursor-pointer select-none pb-2"
          onClick={() => setInsightsExpanded((prev) => !prev)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setInsightsExpanded((prev) => !prev);
            }
          }}
        >
          <CardTitle className="text-[#2D2D2D] flex items-center gap-1">
            {insightsExpanded ? (
              <ChevronUp className="h-5 w-5 inline" />
            ) : (
              <ChevronDown className="h-5 w-5 inline" />
            )}
            對話洞察{!insightsExpanded && insights.length > 0 ? `（${insights.length} 筆）` : ''}
          </CardTitle>

          <p className="text-xs text-[#8A8A8A]">每次對話後的正向分析紀錄</p>
        </CardHeader>

        {insightsExpanded && (
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-3 py-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-[#EDE8E0] animate-pulse" />
              ))}
            </div>
          ) : insights.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm text-[#8A8A8A]">尚未有對話分析紀錄</p>

              <p className="text-xs text-[#B0B0B0] mt-1">
                和小莫聊天後，在下方點「平靜分析」就會出現在這裡
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {insights.map((ins) => {
                const date = new Date(ins.created_at);
                const dateLabel = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

                return (
                  <div
                    key={ins.id}
                    className="p-3 sm:p-4 rounded-lg bg-white border border-[#EDE8E0] shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm sm:text-base text-[#8A8A8A]">{dateLabel}</span>

                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: scoreColor(ins.calm_score) }}
                        >
                          {ins.calm_score}
                        </div>
                      </div>
                    </div>

                    <p className="text-base sm:text-lg text-[#2D2D2D] font-medium mb-2">{ins.summary}</p>

                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#F0EBFA] text-[#5B4A8A]">
                        {ins.calm_state}
                      </span>

                      {ins.emotional_tone && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#FFF8E1] text-[#8A7000]">
                          {ins.emotional_tone}
                        </span>
                      )}
                    </div>

                    {ins.inner_needs?.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs sm:text-sm text-[#8A8A8A] mb-1 font-medium">內在需求</p>

                        {ins.inner_needs.map((need, j) => (
                          <p key={j} className="text-sm sm:text-base text-[#5A5A5A] mb-0.5">
                            • {need}
                          </p>
                        ))}
                      </div>
                    )}

                    {ins.growth_paths?.length > 0 && (
                      <div>
                        <p className="text-xs sm:text-sm text-[#8A8A8A] mb-1 font-medium">回歸平靜的路徑</p>

                        {ins.growth_paths.map((path, j) => (
                          <p key={j} className="text-sm sm:text-base text-[#5A5A5A] mb-0.5">
                            • {path}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
        )}
      </Card>
    </div>
  );
}

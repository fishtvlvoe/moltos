'use client';

// 回顧頁面 — 平靜指數趨勢 + 對話洞察歷史
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

const LEVEL_LABELS: Record<string, string> = {
  calm: '平靜', mild: '輕微波動', moderate: '需留意', attention: '需關注',
};
const LEVEL_COLORS: Record<string, string> = {
  calm: '#4CAF50', mild: '#FFC107', moderate: '#FF9800', attention: '#F44336',
};

function scoreColor(score: number): string {
  if (score >= 70) return '#4CAF50';
  if (score >= 50) return '#FFC107';
  if (score >= 30) return '#FF9800';
  return '#F44336';
}

export default function ReviewPage() {
  const [history, setHistory] = useState<CalmEntry[]>([]);
  const [insights, setInsights] = useState<InsightEntry[]>([]);
  const [loading, setLoading] = useState(true);

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
          ) : (
            <div className="flex flex-col gap-2">
              {history.map((entry, i) => {
                const date = new Date(entry.createdAt);
                const label = `${date.getMonth() + 1}/${date.getDate()}`;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-[#8A8A8A] w-10 shrink-0">{label}</span>
                    <div className="flex-1 h-6 bg-[#EDE8E0] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full flex items-center justify-end pr-2"
                        style={{
                          width: `${Math.max(entry.score, 10)}%`,
                          backgroundColor: LEVEL_COLORS[entry.level] ?? '#7C5CBA',
                        }}
                      >
                        <span className="text-[10px] font-medium text-white">
                          {Math.round(entry.score)}
                        </span>
                      </div>
                    </div>
                    <span
                      className="text-[10px] w-14 shrink-0 text-right"
                      style={{ color: LEVEL_COLORS[entry.level] ?? '#8A8A8A' }}
                    >
                      {LEVEL_LABELS[entry.level] ?? entry.level}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 對話洞察歷史 ── */}
      <Card className="rounded-2xl bg-[#FAF8F4] ring-1 ring-[#EDE8E0]">
        <CardHeader className="pb-2">
          <CardTitle className="text-[#2D2D2D]">對話洞察</CardTitle>
          <p className="text-xs text-[#8A8A8A]">每次對話後的正向分析紀錄</p>
        </CardHeader>
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
                和小莫聊天後，點「分析對話洞察」就會出現在這裡
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
                    className="p-3 rounded-xl bg-white border border-[#EDE8E0]"
                  >
                    {/* 標題列 */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-[#8A8A8A]">{dateLabel}</span>
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: scoreColor(ins.calm_score) }}
                        >
                          {ins.calm_score}
                        </div>
                      </div>
                    </div>

                    {/* 摘要 */}
                    <p className="text-sm text-[#2D2D2D] font-medium mb-1">{ins.summary}</p>

                    {/* 平靜狀態 + 情緒基調 */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F0EBFA] text-[#5B4A8A]">
                        {ins.calm_state}
                      </span>
                      {ins.emotional_tone && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF8E1] text-[#8A7000]">
                          {ins.emotional_tone}
                        </span>
                      )}
                    </div>

                    {/* 內在需求 */}
                    {ins.inner_needs?.length > 0 && (
                      <div className="mb-1.5">
                        <p className="text-[10px] text-[#8A8A8A] mb-0.5">內在需求</p>
                        {ins.inner_needs.map((need, j) => (
                          <p key={j} className="text-xs text-[#5A5A5A]">• {need}</p>
                        ))}
                      </div>
                    )}

                    {/* 回歸平靜的路徑 */}
                    {ins.growth_paths?.length > 0 && (
                      <div>
                        <p className="text-[10px] text-[#8A8A8A] mb-0.5">回歸平靜的路徑</p>
                        {ins.growth_paths.map((path, j) => (
                          <p key={j} className="text-xs text-[#5A5A5A]">• {path}</p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

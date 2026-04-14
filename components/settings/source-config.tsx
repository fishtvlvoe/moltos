'use client';

// T048: 資訊來源設定 — 優先順序、同步頻率、斷開連接
import { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface Source {
  connected: boolean;
  priority: number;
  sync_interval: string;
  email?: string;
}

interface SourceConfigProps {
  userEmail: string;
  initialSources: Record<string, Source>;
}

export function SourceConfig({
  userEmail,
  initialSources,
}: SourceConfigProps) {
  const [sources, setSources] = useState(initialSources);
  const [loading, setLoading] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const { toast } = useToast();

  const handlePriorityChange = useCallback(
    (sourceName: string, priority: number) => {
      setSources((prev) => ({
        ...prev,
        [sourceName]: { ...prev[sourceName], priority },
      }));
    },
    []
  );

  const handleSyncIntervalChange = useCallback(
    (sourceName: string, interval: string) => {
      setSources((prev) => ({
        ...prev,
        [sourceName]: { ...prev[sourceName], sync_interval: interval },
      }));
    },
    []
  );

  const handleSave = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch('/api/settings/sources', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sources),
      });

      const body = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };

      if (!res.ok || body.success !== true) {
        toast.error('更新失敗，請重試');
        return;
      }

      toast.success('設定已保存');
    } catch {
      toast.error('網路錯誤，請重試');
    } finally {
      setLoading(false);
    }
  }, [sources, toast]);

  const handleDisconnect = useCallback(async () => {
    setShowDisconnectConfirm(false);
    setLoading(true);

    try {
      const res = await fetch('/api/settings/sources/disconnect', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'gmail' }),
      });

      const body = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };

      if (!res.ok || body.success !== true) {
        toast.error('解除綁定失敗，請重試');
        return;
      }

      setSources((prev) => ({
        ...prev,
        gmail: { ...prev.gmail, connected: false },
      }));

      toast.success('已解除 Gmail 綁定');
    } catch {
      toast.error('網路錯誤，請重試');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return (
    <Card className="rounded-2xl shadow-sm border-0 bg-white">
      <CardContent className="py-4 px-4">
        <div className="space-y-4">
          {Object.entries(sources).map(([sourceName, source]) => (
            <div key={sourceName}>
              {source.connected && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {sourceName === 'gmail' ? 'Gmail' : sourceName} 優先順序
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={source.priority}
                      onChange={(e) =>
                        handlePriorityChange(sourceName, parseInt(e.target.value))
                      }
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      同步頻率
                    </label>
                    <select
                      value={source.sync_interval}
                      onChange={(e) =>
                        handleSyncIntervalChange(sourceName, e.target.value)
                      }
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <option value="hourly">每小時</option>
                      <option value="daily">每日</option>
                      <option value="on-demand">手動同步</option>
                    </select>
                  </div>

                  <button
                    onClick={() => void handleSave()}
                    disabled={loading}
                    className="w-full mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? '保存中...' : '保存設定'}
                  </button>

                  {sourceName === 'gmail' && (
                    <button
                      onClick={() => setShowDisconnectConfirm(true)}
                      disabled={loading}
                      className="w-full mt-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      解除綁定
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Disconnect Confirmation Dialog */}
        {showDisconnectConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                確定要解除 Gmail 綁定嗎？
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                平靜指數歷史將保留，但新郵件將不再同步。
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDisconnectConfirm(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  取消
                </button>
                <button
                  onClick={() => void handleDisconnect()}
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="inline size-4 animate-spin mr-1" />
                  ) : null}
                  解除綁定
                </button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

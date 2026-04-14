'use client';

// T049: 隱私設定開關 — 個性化、分析、推薦
import { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface PrivacySettings {
  personalization: boolean;
  analytics: boolean;
  recommendations: boolean;
}

interface PrivacyTogglesProps {
  userEmail: string;
  initialSettings: PrivacySettings;
}

export function PrivacyToggles({
  userEmail,
  initialSettings,
}: PrivacyTogglesProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleToggle = useCallback(
    async (key: keyof PrivacySettings) => {
      const newValue = !settings[key];
      const oldValue = settings[key];

      // Optimistic update
      setSettings((prev) => ({ ...prev, [key]: newValue }));
      setLoading(true);

      try {
        const res = await fetch('/api/settings/privacy', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...settings, [key]: newValue }),
        });

        const body = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          error?: string;
        };

        if (!res.ok || body.success !== true) {
          // Revert on error
          setSettings((prev) => ({ ...prev, [key]: oldValue }));
          toast.error('更新失敗，請重試');
          return;
        }

        toast.success('設定已更新');
      } catch {
        // Revert on network error
        setSettings((prev) => ({ ...prev, [key]: oldValue }));
        toast.error('網路錯誤，請重試');
      } finally {
        setLoading(false);
      }
    },
    [settings, toast]
  );

  const toggleLabels = {
    personalization: {
      title: '個性化',
      description: '使用您的活動改進推薦和平靜指數計算',
    },
    analytics: {
      title: '使用分析',
      description: '幫助我們改進產品',
    },
    recommendations: {
      title: '推薦功能',
      description: '基於您的使用模式接收建議',
    },
  };

  return (
    <Card className="rounded-2xl shadow-sm border-0 bg-white">
      <CardContent className="py-4 px-0">
        {Object.entries(toggleLabels).map(([key, label], index) => (
          <div key={key}>
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex-1 pr-4">
                <p className="text-gray-900 text-sm font-medium">{label.title}</p>
                <p className="text-gray-500 text-xs mt-1">{label.description}</p>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  void handleToggle(key as keyof PrivacySettings)
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings[key as keyof PrivacySettings]
                    ? 'bg-blue-500'
                    : 'bg-gray-300'
                } disabled:opacity-50`}
                role="switch"
                aria-checked={settings[key as keyof PrivacySettings]}
              >
                {loading && (
                  <Loader2 className="absolute left-2 size-3 animate-spin text-white" />
                )}
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    settings[key as keyof PrivacySettings]
                      ? 'translate-x-5'
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            {index < Object.entries(toggleLabels).length - 1 && (
              <div className="mx-4 h-px bg-gray-100" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

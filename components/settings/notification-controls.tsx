'use client';

// T044: 通知控制卡片 — 三個獨立 toggle (郵件、應用內、推播)
import { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface NotificationPreferences {
  email: boolean;
  in_app: boolean;
  push: boolean;
}

interface NotificationControlsProps {
  userEmail: string;
  initialPreferences: NotificationPreferences;
}

export function NotificationControls({
  userEmail,
  initialPreferences,
}: NotificationControlsProps) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleToggle = useCallback(
    async (channel: keyof NotificationPreferences) => {
      const newValue = !preferences[channel];
      const oldValue = preferences[channel];

      // Optimistic update
      setPreferences((prev) => ({ ...prev, [channel]: newValue }));
      setLoading(true);

      try {
        const res = await fetch('/api/settings/notifications', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel, enabled: newValue }),
        });

        const body = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          error?: string;
        };

        if (!res.ok || body.success !== true) {
          // Revert on error
          setPreferences((prev) => ({ ...prev, [channel]: oldValue }));
          toast.error('更新失敗，請重試');
          return;
        }

        toast.success('設定已更新');
      } catch {
        // Revert on network error
        setPreferences((prev) => ({ ...prev, [channel]: oldValue }));
        toast.error('網路錯誤，請重試');
      } finally {
        setLoading(false);
      }
    },
    [preferences, toast]
  );

  const channelLabels = {
    email: '郵件通知',
    in_app: '應用內通知',
    push: '推播通知',
  } as const;

  return (
    <Card className="rounded-2xl shadow-sm border-0 bg-white">
      <CardContent className="py-4 px-0">
        {Object.entries(channelLabels).map(([channel, label], index) => (
          <div key={channel}>
            <div className="flex items-center justify-between px-4 py-4">
              <span className="text-gray-700 text-sm font-medium">{label}</span>
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  void handleToggle(channel as keyof NotificationPreferences)
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences[channel as keyof NotificationPreferences]
                    ? 'bg-blue-500'
                    : 'bg-gray-300'
                } disabled:opacity-50`}
                role="switch"
                aria-checked={
                  preferences[channel as keyof NotificationPreferences]
                }
              >
                {loading && (
                  <Loader2 className="absolute left-2 size-3 animate-spin text-white" />
                )}
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    preferences[channel as keyof NotificationPreferences]
                      ? 'translate-x-5'
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            {index < 2 && <div className="mx-4 h-px bg-gray-100" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

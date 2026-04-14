'use client';

// T047: 提醒排程表單 — 支援啟用/停用、時間、頻率、類型選擇
import { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface ReminderSchedule {
  enabled: boolean;
  time: string;
  frequency: string;
  types: string[];
}

interface ReminderFormProps {
  userEmail: string;
  initialSchedule: ReminderSchedule;
}

export function ReminderForm({
  userEmail,
  initialSchedule,
}: ReminderFormProps) {
  const [schedule, setSchedule] = useState(initialSchedule);
  const [loading, setLoading] = useState(false);
  const [timeError, setTimeError] = useState('');
  const [typesError, setTypesError] = useState('');
  const { toast } = useToast();

  const validateTime = (time: string): boolean => {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  const handleToggle = useCallback(async () => {
    const newSchedule = { ...schedule, enabled: !schedule.enabled };
    setSchedule(newSchedule);
    setLoading(true);

    try {
      const res = await fetch('/api/settings/reminders', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchedule),
      });

      const body = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };

      if (!res.ok || body.success !== true) {
        setSchedule((prev) => ({ ...prev, enabled: !prev.enabled }));
        toast.error('更新失敗，請重試');
        return;
      }

      toast.success('設定已更新');
    } catch {
      setSchedule((prev) => ({ ...prev, enabled: !prev.enabled }));
      toast.error('網路錯誤，請重試');
    } finally {
      setLoading(false);
    }
  }, [schedule, toast]);

  const handleTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    setSchedule((prev) => ({ ...prev, time }));

    if (!validateTime(time)) {
      setTimeError('時間格式必須為 HH:MM');
    } else {
      setTimeError('');
    }
  }, []);

  const handleFrequencyChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSchedule((prev) => ({ ...prev, frequency: e.target.value }));
  }, []);

  const handleTypeToggle = useCallback((type: string) => {
    setSchedule((prev) => {
      const newTypes = prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type];

      if (newTypes.length === 0) {
        setTypesError('至少需要選擇一個提醒類型');
      } else {
        setTypesError('');
      }

      return { ...prev, types: newTypes };
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!validateTime(schedule.time)) {
      toast.error('時間格式無效');
      return;
    }

    if (schedule.enabled && schedule.types.length === 0) {
      toast.error('請至少選擇一個提醒類型');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/settings/reminders', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule),
      });

      const body = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };

      if (!res.ok || body.success !== true) {
        toast.error('更新失敗，請重試');
        return;
      }

      toast.success('排程已保存');
    } catch {
      toast.error('網路錯誤，請重試');
    } finally {
      setLoading(false);
    }
  }, [schedule, toast]);

  return (
    <Card className="rounded-2xl shadow-sm border-0 bg-white">
      <CardContent className="py-4 px-4">
        <div className="space-y-4">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-gray-700 text-sm font-medium">啟用提醒</span>
            <button
              type="button"
              disabled={loading}
              onClick={() => void handleToggle()}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                schedule.enabled ? 'bg-blue-500' : 'bg-gray-300'
              } disabled:opacity-50`}
              role="switch"
              aria-checked={schedule.enabled}
            >
              {loading && (
                <Loader2 className="absolute left-2 size-3 animate-spin text-white" />
              )}
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  schedule.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {schedule.enabled && (
            <>
              <div className="border-t border-gray-100" />

              {/* Time Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  提醒時間
                </label>
                <input
                  type="time"
                  value={schedule.time}
                  onChange={handleTimeChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                {timeError && (
                  <p className="text-red-500 text-xs mt-1">{timeError}</p>
                )}
              </div>

              {/* Frequency Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  提醒頻率
                </label>
                <select
                  value={schedule.frequency}
                  onChange={handleFrequencyChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="daily">每日</option>
                  <option value="weekly">每週</option>
                  <option value="monthly">每月</option>
                </select>
              </div>

              {/* Type Checkboxes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  提醒類型
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'calm_index', label: '平靜指數' },
                    { id: 'chat_summary', label: '對話摘要' },
                  ].map((type) => (
                    <label
                      key={type.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={schedule.types.includes(type.id)}
                        onChange={() => handleTypeToggle(type.id)}
                        disabled={loading}
                        className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <span className="text-sm text-gray-700">{type.label}</span>
                    </label>
                  ))}
                </div>
                {typesError && (
                  <p className="text-yellow-600 text-xs mt-2">{typesError}</p>
                )}
              </div>

              {/* Save Button */}
              <button
                onClick={() => void handleSave()}
                disabled={loading || !schedule.enabled || schedule.types.length === 0}
                className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '保存中...' : '保存排程'}
              </button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

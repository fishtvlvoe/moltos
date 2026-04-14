// T047: 提醒狀態卡片 — 展示當前提醒排程
import { Card, CardContent } from '@/components/ui/card';

interface ReminderSchedule {
  enabled: boolean;
  time: string;
  frequency: string;
  types: string[];
}

interface ReminderStatusProps {
  schedule: ReminderSchedule;
}

export function ReminderStatus({ schedule }: ReminderStatusProps) {
  const getFrequencyLabel = () => {
    const frequencies: Record<string, string> = {
      daily: '每日',
      weekly: '每週',
      monthly: '每月',
    };
    return frequencies[schedule.frequency] || schedule.frequency;
  };

  const getTypesLabel = () => {
    const types: Record<string, string> = {
      calm_index: '平靜指數',
      chat_summary: '對話摘要',
    };
    return schedule.types.map((t) => types[t] || t).join('、');
  };

  return (
    <Card className="rounded-2xl shadow-sm border-0 bg-white">
      <CardContent className="py-6">
        <div className="text-center">
          <p className="text-gray-600 text-sm">
            {schedule.enabled ? `每${getFrequencyLabel()} ${schedule.time}` : '提醒已停用'}
          </p>
          {schedule.enabled && (
            <p className="text-gray-800 text-base font-medium mt-2">
              {getTypesLabel()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// T043: 通知狀態卡片 — 展示當前通知偏好
import { Card, CardContent } from '@/components/ui/card';

interface NotificationPreferences {
  email: boolean;
  in_app: boolean;
  push: boolean;
}

interface NotificationStatusProps {
  preferences: NotificationPreferences;
}

export function NotificationStatus({ preferences }: NotificationStatusProps) {
  const getStatus = () => {
    const enabled = Object.values(preferences).filter(Boolean).length;
    if (enabled === 0) return '所有通知已停用';
    if (enabled === 3) return '所有通知已啟用';
    return `${enabled} 個通知頻道已啟用`;
  };

  return (
    <Card className="rounded-2xl shadow-sm border-0 bg-white">
      <CardContent className="py-6">
        <div className="text-center">
          <p className="text-gray-600 text-sm">{getStatus()}</p>
          <p className="text-gray-800 text-base font-medium mt-2">
            郵件・應用內・推播
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

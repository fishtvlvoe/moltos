// T046: 通知設定頁面 — Server Component，整合通知偏好狀態 + 控制元件
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { NotificationStatus } from '@/components/settings/notification-status';
import { NotificationControls } from '@/components/settings/notification-controls';

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/onboarding');
  }

  const userEmail = session.user.email;

  // Fetch notification preferences from DB
  // TODO: 實作資料庫查詢 (getNotificationPreferences)
  // 預設值: { email: true, in_app: true, push: false }
  const preferences = {
    email: true,
    in_app: true,
    push: false,
  };

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex items-center gap-2 pt-2">
        <Link
          href="/settings"
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm"
        >
          <span className="text-base">←</span>
          <span>通知設定</span>
        </Link>
      </div>

      <NotificationStatus preferences={preferences} />

      <NotificationControls userEmail={userEmail} initialPreferences={preferences} />
    </div>
  );
}

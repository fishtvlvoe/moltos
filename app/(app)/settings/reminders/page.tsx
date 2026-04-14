// T047: 提醒排程設定頁面 — Server Component，整合提醒狀態 + 控制元件
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ReminderStatus } from '@/components/settings/reminder-status';
import { ReminderForm } from '@/components/settings/reminder-form';

export default async function RemindersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/onboarding');
  }

  const userEmail = session.user.email;

  // Fetch reminder schedule from DB
  // TODO: 實作資料庫查詢 (getReminderSchedule)
  // 預設值: { enabled: false, time: "09:00", frequency: "daily", types: ["calm_index"] }
  const schedule = {
    enabled: false,
    time: '09:00',
    frequency: 'daily',
    types: ['calm_index'],
  };

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex items-center gap-2 pt-2">
        <Link
          href="/settings"
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm"
        >
          <span className="text-base">←</span>
          <span>提醒排程</span>
        </Link>
      </div>

      <ReminderStatus schedule={schedule} />

      <ReminderForm userEmail={userEmail} initialSchedule={schedule} />
    </div>
  );
}

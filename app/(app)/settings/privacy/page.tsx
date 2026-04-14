// T049: 隱私與資料設定頁面 — Server Component
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PrivacyPolicy } from '@/components/settings/privacy-policy';
import { PrivacyToggles } from '@/components/settings/privacy-toggles';
import { ClearUserDataSection } from '@/components/settings/clear-user-data-section';

export default async function PrivacyPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/onboarding');
  }

  const userEmail = session.user.email;

  // Fetch privacy settings from DB
  // TODO: 實作資料庫查詢 (getPrivacySettings)
  // 預設值: { personalization: true, analytics: true, recommendations: true }
  const privacySettings = {
    personalization: true,
    analytics: true,
    recommendations: true,
  };

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex items-center gap-2 pt-2">
        <Link
          href="/settings"
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm"
        >
          <span className="text-base">←</span>
          <span>隱私與資料</span>
        </Link>
      </div>

      <PrivacyPolicy />

      <PrivacyToggles userEmail={userEmail} initialSettings={privacySettings} />

      <div className="border-t border-gray-200 pt-4 mt-4">
        <h3 className="text-gray-900 font-semibold text-sm mb-3 px-0">
          危險區域
        </h3>
        <ClearUserDataSection isDemo={false} />
      </div>
    </div>
  );
}

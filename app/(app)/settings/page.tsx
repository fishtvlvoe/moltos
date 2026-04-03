// T043: 設定頁面 — Server Component，整合個人資料 + 選單 + 登出
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ProfileCard } from '@/components/settings/profile-card';
import { MenuCard } from '@/components/settings/menu-card';
import { LogoutButton } from '@/components/settings/logout-button';

export default async function SettingsPage() {
  // 伺服器端驗證 session
  const session = await getServerSession(authOptions);

  if (!session) {
    // 未登入 → 導向 onboarding
    redirect('/onboarding');
  }

  return (
    // 背景色 #FAF8F4，max-w-md 置中，mobile-first
    <div
      className="flex flex-col gap-4 py-2"
      style={{ backgroundColor: '#FAF8F4' }}
    >
      {/* 頁面標題 */}
      <h1 className="text-gray-800 text-xl font-semibold pt-2">設定</h1>

      {/* 個人資料卡片 */}
      <ProfileCard user={session.user ?? {}} />

      {/* 設定選單卡片 */}
      <MenuCard />

      {/* 登出按鈕（需要 Client Component 呼叫 signOut） */}
      <LogoutButton />
    </div>
  );
}

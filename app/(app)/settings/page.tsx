// T043: 設定頁面 — Server Component，整合個人資料 + 選單 + 登出
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ProfileCard } from '@/components/settings/profile-card';
import { MenuCard } from '@/components/settings/menu-card';
import { LogoutButton } from '@/components/settings/logout-button';
import { ClearUserDataSection } from '@/components/settings/clear-user-data-section';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const params = await searchParams;
  const isDemo = params.demo === 'true';

  const session = await getServerSession(authOptions);

  if (!session && !isDemo) {
    redirect('/onboarding');
  }

  // demo 模式用假資料
  const user = isDemo
    ? { name: '小明', email: 'demo@moltos.app', image: null }
    : (session?.user ?? {});

  return (
    <div
      className="flex flex-col gap-4 py-2"
      style={{ backgroundColor: '#FAF8F4' }}
    >
      <h1 className="text-gray-800 text-xl font-semibold pt-2">設定</h1>

      <ProfileCard user={user} />

      {/* 設定選單卡片 */}
      <MenuCard />

      {/* 登出按鈕（需要 Client Component 呼叫 signOut） */}
      <LogoutButton />

      <ClearUserDataSection isDemo={isDemo} />
    </div>
  );
}

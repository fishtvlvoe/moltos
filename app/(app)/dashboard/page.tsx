// T017+T027: Dashboard 頁面 — Server Component 問候 + Client Component 平靜指數
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalmIndexCard } from '@/components/dashboard/calm-index-card';
import { TodayProgress } from '@/components/dashboard/today-progress';
import { NewsCard } from '@/components/dashboard/news-card';
import { WellnessCard } from '@/components/dashboard/wellness-card';

// 依伺服器時間回傳對應問候語（台灣時區以 UTC+8 計算）
function getGreeting(hour: number): string {
  if (hour >= 6 && hour < 12) return '早安';
  if (hour >= 12 && hour < 18) return '午安';
  if (hour >= 18 && hour < 24) return '晚安';
  return '深夜好'; // 0-6
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const params = await searchParams;
  const isDemo = params.demo === 'true';

  // 伺服器端驗證 session（demo 模式跳過）
  const session = await getServerSession(authOptions);

  if (!session && !isDemo) {
    redirect('/onboarding');
  }

  // demo 模式用假名稱，正常模式用 session
  const fullName = isDemo ? '小明' : (session?.user?.name ?? '朋友');
  const firstName = fullName.split(' ')[0];

  // 依目前伺服器時間（UTC+8）計算問候語
  const now = new Date();
  const hourUTC8 = (now.getUTCHours() + 8) % 24;
  const greeting = getGreeting(hourUTC8);

  // 使用者頭像首字作為 fallback
  const avatarFallback = firstName.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-6 py-2">
      {/* 頂部問候區：大頭貼 + 問候語 + 名字 */}
      <div className="flex items-center gap-4 pt-2">
        <Avatar className="w-12 h-12">
          <AvatarImage
            src={session?.user?.image ?? undefined}
            alt={fullName}
          />
          <AvatarFallback
            className="text-white text-base font-semibold"
            style={{ backgroundColor: '#C67A52' }}
          >
            {avatarFallback}
          </AvatarFallback>
        </Avatar>
        <div>
          {/* 問候語 */}
          <p className="text-gray-500 text-sm">{greeting}，</p>
          <h1 className="text-gray-800 text-xl font-semibold">{firstName}</h1>
        </div>
      </div>

      {/* 平靜指數卡片 — 從 /api/calm-index 取得真實資料 */}
      <CalmIndexCard />

      {/* 今日進度卡片 — 靜態假資料 placeholder */}
      <TodayProgress />

      {/* 今日摘要卡片 — 從 /api/youtube/feed 取得真實資料 */}
      <NewsCard />

      {/* 健康追蹤卡片 — 靜態假資料 */}
      <WellnessCard />
    </div>
  );
}

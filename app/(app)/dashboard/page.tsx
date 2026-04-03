// T017: Dashboard 頁面骨架 — Server Component，依 session 顯示個人化問候
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// 依伺服器時間回傳對應問候語（台灣時區以 UTC+8 計算）
function getGreeting(hour: number): string {
  if (hour >= 6 && hour < 12) return '早安';
  if (hour >= 12 && hour < 18) return '午安';
  if (hour >= 18 && hour < 24) return '晚安';
  return '深夜好'; // 0-6
}

export default async function DashboardPage() {
  // 伺服器端驗證 session
  const session = await getServerSession(authOptions);

  if (!session) {
    // 未登入 → 導向 onboarding
    redirect('/onboarding');
  }

  // 取得使用者名稱（截取名字中第一個空格前的部分作為稱呼）
  const fullName = session.user?.name ?? '朋友';
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
            src={session.user?.image ?? undefined}
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

      {/* 平靜指數卡片 */}
      <Card className="rounded-2xl shadow-sm border-0 bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base text-gray-800">
            <span>平靜指數</span>
            {/* 即將推出 badge */}
            <Badge
              variant="secondary"
              className="text-xs rounded-full"
              style={{ backgroundColor: '#FDF0E8', color: '#C67A52' }}
            >
              即將推出
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 佔位說明文字 */}
          <p className="text-gray-400 text-sm">
            透過 Gmail 分析你的數位壓力，量化每日情緒負擔。
          </p>
          {/* 佔位視覺區塊 */}
          <div className="mt-3 h-20 rounded-xl bg-gray-50 flex items-center justify-center">
            <span className="text-gray-300 text-xs">功能開發中</span>
          </div>
        </CardContent>
      </Card>

      {/* 今日摘要卡片 */}
      <Card className="rounded-2xl shadow-sm border-0 bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base text-gray-800">
            <span>今日摘要</span>
            <Badge
              variant="secondary"
              className="text-xs rounded-full"
              style={{ backgroundColor: '#FDF0E8', color: '#C67A52' }}
            >
              即將推出
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-sm">
            YouTube 訂閱頻道精選內容，為你濾除資訊噪音。
          </p>
          <div className="mt-3 h-20 rounded-xl bg-gray-50 flex items-center justify-center">
            <span className="text-gray-300 text-xs">功能開發中</span>
          </div>
        </CardContent>
      </Card>

      {/* 健康追蹤卡片 */}
      <Card className="rounded-2xl shadow-sm border-0 bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base text-gray-800">
            <span>健康追蹤</span>
            <Badge
              variant="secondary"
              className="text-xs rounded-full"
              style={{ backgroundColor: '#FDF0E8', color: '#C67A52' }}
            >
              即將推出
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-sm">
            長期情緒與壓力趨勢，讓你看見自己的成長。
          </p>
          <div className="mt-3 h-20 rounded-xl bg-gray-50 flex items-center justify-center">
            <span className="text-gray-300 text-xs">功能開發中</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

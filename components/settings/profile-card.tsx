// T041: 設定頁個人資料卡片 — 大頭貼 + 姓名 + email
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProfileCardProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function ProfileCard({ user }: ProfileCardProps) {
  // 取名字首字作為大頭貼 fallback
  const fallbackChar = (user.name ?? user.email ?? '?').charAt(0).toUpperCase();

  return (
    <Card className="rounded-2xl shadow-sm border-0 bg-white">
      <CardContent className="flex flex-col items-center gap-3 py-6">
        {/* 大頭貼（64px） */}
        <Avatar className="w-16 h-16">
          <AvatarImage
            src={user.image ?? undefined}
            alt={user.name ?? '使用者'}
          />
          <AvatarFallback
            className="text-white text-xl font-semibold"
            style={{ backgroundColor: '#C67A52' }}
          >
            {fallbackChar}
          </AvatarFallback>
        </Avatar>

        {/* 姓名 */}
        {user.name && (
          <p className="text-gray-800 text-lg font-semibold leading-tight">
            {user.name}
          </p>
        )}

        {/* Email */}
        {user.email && (
          <p className="text-gray-400 text-sm">{user.email}</p>
        )}
      </CardContent>
    </Card>
  );
}

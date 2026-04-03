// T045: Gmail 設定子頁面 — Server Component，整合 GmailStatus + 操作按鈕
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { GmailStatus } from '@/components/settings/gmail-status';
import { GmailActions } from '@/components/settings/gmail-actions';

export default async function GmailSettingsPage() {
  // 伺服器端驗證 session
  const session = await getServerSession(authOptions);

  if (!session) {
    // 未登入 → 導向 onboarding
    redirect('/onboarding');
  }

  return (
    <div className="flex flex-col gap-4 py-2">
      {/* 頂部返回導航列 */}
      <div className="flex items-center gap-2 pt-2">
        <Link
          href="/settings"
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm"
        >
          {/* 左箭頭 */}
          <span className="text-base">←</span>
          <span>Gmail 整合</span>
        </Link>
      </div>

      {/* Gmail 連接狀態元件 */}
      <GmailStatus email={session.user?.email} />

      {/* 重新授權 / 解除綁定按鈕（Client Component） */}
      <GmailActions />
    </div>
  );
}

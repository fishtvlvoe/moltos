// T048: 資訊來源設定頁面 — Server Component
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SourcesList } from '@/components/settings/sources-list';
import { SourceConfig } from '@/components/settings/source-config';
import { getGmailConnectionState } from '@/lib/db';

export default async function SourcesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/onboarding');
  }

  const userEmail = session.user.email;

  // Fetch Gmail connection state
  const { connected: gmailConnected, gmailEmail } =
    await getGmailConnectionState(userEmail);

  // Fetch source priorities from DB
  // TODO: 實作資料庫查詢 (getSourcePriorities)
  // 預設值: { gmail: { connected, priority: 1, sync_interval: "daily" } }
  const sourcePriorities = {
    gmail: {
      connected: gmailConnected,
      priority: 1,
      sync_interval: 'daily',
      email: gmailEmail || userEmail,
    },
  };

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex items-center gap-2 pt-2">
        <Link
          href="/settings"
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm"
        >
          <span className="text-base">←</span>
          <span>資訊來源</span>
        </Link>
      </div>

      <SourcesList sources={sourcePriorities} />

      <SourceConfig userEmail={userEmail} initialSources={sourcePriorities} />
    </div>
  );
}

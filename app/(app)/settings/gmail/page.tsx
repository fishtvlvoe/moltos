// T045: Gmail 設定子��面 — Server Component
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { GmailStatus } from '@/components/settings/gmail-status';
import { GmailActions } from '@/components/settings/gmail-actions';
import { getGmailConnectionState } from '@/lib/db';

function formatLastSyncLabel(iso: string | null): string | null {
  if (!iso) return null;

  const d = new Date(iso);

  if (Number.isNaN(d.getTime())) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return `\u4e0a\u6b21\u540c\u6b65\uff1a${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function GmailSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/onboarding');
  }

  const userEmail = session.user.email;

  const { connected, gmailEmail, lastSyncAt } =
    await getGmailConnectionState(userEmail);

  const displayGmail =
    connected && gmailEmail ? gmailEmail : connected ? userEmail : null;

  const lastSyncTime = connected ? formatLastSyncLabel(lastSyncAt) : null;

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex items-center gap-2 pt-2">
        <Link
          href="/settings"
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm"
        >
          <span className="text-base">←</span>
          <span>Gmail 整合</span>
        </Link>
      </div>

      <GmailStatus email={displayGmail} lastSyncTime={lastSyncTime} />

      <GmailActions isGmailConnected={connected} />
    </div>
  );
}

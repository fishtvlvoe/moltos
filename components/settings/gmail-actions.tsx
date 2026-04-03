'use client';

// T045: Gmail 操作按鈕 — Client Component，重新授權 + 解除綁定
import { signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export function GmailActions() {
  return (
    <div className="flex flex-col gap-3">
      {/* 重新授權：重走 Google OAuth 流程 */}
      <Button
        className="w-full rounded-2xl text-white font-medium"
        style={{ backgroundColor: '#C67A52' }}
        onClick={() =>
          signIn('google', { callbackUrl: '/settings/gmail' })
        }
      >
        重新授權
      </Button>

      {/* 解除 Gmail 綁定：MVP 簡化為登出（signOut） */}
      <Button
        variant="outline"
        className="w-full rounded-2xl border-red-200 text-red-500 hover:text-red-600 hover:bg-red-50"
        onClick={() => signOut({ callbackUrl: '/onboarding' })}
      >
        解除 Gmail 綁定
      </Button>
    </div>
  );
}

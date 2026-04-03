'use client';

// T043: 登出按鈕 — Client Component，呼叫 NextAuth signOut
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
  return (
    <Button
      variant="outline"
      className="w-full rounded-2xl border-gray-200 text-gray-600 mt-2"
      onClick={() =>
        // 登出後導向 onboarding 頁面
        signOut({ callbackUrl: '/onboarding' })
      }
    >
      登出
    </Button>
  );
}

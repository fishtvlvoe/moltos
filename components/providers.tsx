'use client';

// T012: SessionProvider wrapper — 讓 server component 的 layout 可使用 NextAuth session
import { SessionProvider } from 'next-auth/react';

import { Toaster } from '@/components/ui/sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster richColors closeButton />
    </SessionProvider>
  );
}

// T016: 根路由 — 依登入狀態導向 dashboard 或 onboarding
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function Home() {
  // 檢查伺服器端 session
  const session = await getServerSession(authOptions);

  if (session) {
    // 已登入 → 前往 dashboard
    redirect('/dashboard');
  }

  // 未登入 → 前往 onboarding
  redirect('/onboarding');
}
